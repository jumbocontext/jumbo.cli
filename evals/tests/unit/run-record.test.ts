import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { JsonResultStore } from '../../src/storage/json-result-store.js';
import { createTestScenario } from '../../src/domain/types.js';
import { createProgram } from '../../src/cli/index.js';
import type { ExecResult } from '../../src/infrastructure/container-manager.js';
import type { HarnessAdapter } from '../../src/harness/harness-adapter.js';
import type { LocalExecutor } from '../../src/infrastructure/local-executor.js';
import type { EvalRunRecord, RunHeartbeat, SessionRecord, TestResult, TestScenario } from '../../src/domain/types.js';
import type { ResultStore } from '../../src/storage/result-store.js';

describe('run records', () => {
  let tmpDir: string;
  let store: JsonResultStore;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'jumbo-run-record-'));
    store = new JsonResultStore(tmpDir);
    await store.initialize();
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('persists run records under runs/<runId>/run.json', async () => {
    const record: EvalRunRecord = {
      runId: 'run-1',
      scenarioId: 'scenario-1',
      harnesses: ['claude-code', 'codex-cli'],
      sessionCount: 2,
      startedAt: '2026-04-29T10:00:00.000Z',
      status: 'running',
    };

    await store.saveRunRecord(record);

    await expect(fs.readFile(path.join(tmpDir, 'runs', 'run-1', 'run.json'), 'utf-8')).resolves.toContain('"runId": "run-1"');
    await expect(store.getRunRecord('run-1')).resolves.toEqual(record);
    await expect(store.listRunRecords('scenario-1')).resolves.toEqual([record]);
  });

  it('writes heartbeat state atomically and leaves only parseable JSON visible', async () => {
    const first = makeHeartbeat('run-atomic', 'pending');
    const second = makeHeartbeat('run-atomic', 'completed');

    await Promise.all(Array.from({ length: 20 }, async (_, index) => {
      await store.writeHeartbeat('run-atomic', index % 2 === 0 ? first : second);
      const observed = await store.readHeartbeat('run-atomic');
      expect(observed?.runId).toBe('run-atomic');
    }));

    const files = await fs.readdir(path.join(tmpDir, 'runs', 'run-atomic'));
    expect(files).toContain('state.json');
    expect(files.some((file) => file.endsWith('.tmp'))).toBe(false);
    await expect(store.readHeartbeat('run-atomic')).resolves.toMatchObject({ runId: 'run-atomic' });
  });
});

describe('run command run records', () => {
  it('transitions the run record to failed when execution fails', async () => {
    const store = new RunStateStore();
    store.scenarios.push(createTestScenario({
      id: 'scenario-cli-fail',
      name: 'CLI failure',
      initialPrompt: 'Build',
      sessionCount: 1,
    }));
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = createProgram({
      storeProvider: async () => store,
      executorProvider: () => createFailingHarnessExecutor(),
      adapterProvider: () => createAdapter(),
    });

    await expect(program.parseAsync([
      'node', 'eval', 'run', '--scenario', 'scenario-cli-fail',
    ])).rejects.toThrow('harness mock session 1 failed');

    expect(store.runRecords.map((record) => record.status)).toEqual(['running', 'failed']);
    expect(store.runRecords[1].completedAt).toBeDefined();
    const failed = store.heartbeats
      .flatMap((heartbeat) => heartbeat.harnesses)
      .filter((harness) => harness.variant === 'jumbo')
      .flatMap((harness) => harness.sessions)
      .findLast((session) => session.status === 'failed');
    expect(failed?.phase).toBe('harness-exec');
    expect(failed?.errorMessage).toContain('harness mock session 1 failed');
    logSpy.mockRestore();
  });
});

function makeHeartbeat(runId: string, status: 'pending' | 'completed'): RunHeartbeat {
  return {
    runId,
    scenarioId: 'scenario-1',
    updatedAt: new Date().toISOString(),
    harnesses: [{
      harness: 'claude-code',
      variant: 'jumbo',
      sessions: [{ sessionNumber: 1, status }],
    }],
  };
}

class RunStateStore implements ResultStore {
  readonly scenarios: TestScenario[] = [];
  readonly runRecords: EvalRunRecord[] = [];
  readonly heartbeats: RunHeartbeat[] = [];

  async saveScenario(scenario: TestScenario): Promise<void> {
    this.scenarios.push(scenario);
  }

  async getScenario(id: string): Promise<TestScenario | null> {
    return this.scenarios.find((scenario) => scenario.id === id) ?? null;
  }

  async listScenarios(): Promise<TestScenario[]> {
    return [...this.scenarios];
  }

  async saveSessionRecord(_record: SessionRecord): Promise<void> {}

  async getSessionRecords(_scenarioId: string): Promise<SessionRecord[]> {
    return [];
  }

  async saveTestResult(_result: TestResult): Promise<void> {}

  async getTestResult(_id: string): Promise<TestResult | null> {
    return null;
  }

  async listTestResults(_scenarioId?: string): Promise<TestResult[]> {
    return [];
  }

  async saveRunRecord(record: EvalRunRecord): Promise<void> {
    this.runRecords.push(record);
  }

  async getRunRecord(_runId: string): Promise<EvalRunRecord | null> {
    return null;
  }

  async listRunRecords(_scenarioId?: string): Promise<EvalRunRecord[]> {
    return [...this.runRecords];
  }

  async writeHeartbeat(_runId: string, heartbeat: RunHeartbeat): Promise<void> {
    this.heartbeats.push(heartbeat);
  }

  async readHeartbeat(_runId: string): Promise<RunHeartbeat | null> {
    return null;
  }
}

function createFailingHarnessExecutor(): LocalExecutor {
  let dir = 0;
  return {
    createWorkDir: async (prefix?: string) => `/tmp/${prefix ?? 'eval'}${++dir}`,
    installJumboShim: async (workDir: string) => ({ env: { PATH: `${workDir}/.eval-bin:/usr/bin` } }),
    exec: async (_workDir: string, command: string[], options?: { env?: Record<string, string | undefined> }) => {
      if (command[0] === 'jumbo' && command[1] === '--version') {
        const shimmed = options?.env?.PATH?.includes('.eval-bin') ?? false;
        return shimmed
          ? { stdout: '', stderr: 'shim', exitCode: 127 }
          : { stdout: 'jumbo 1.2.3', stderr: '', exitCode: 0 };
      }
      if (command[0] === 'mock') {
        return { stdout: '', stderr: 'harness crashed', exitCode: 2 };
      }
      if (command[0] === 'jumbo' && command[3] === '--format') {
        return { stdout: '[]', stderr: '', exitCode: 0 };
      }
      return { stdout: 'ok', stderr: '', exitCode: 0 };
    },
    cleanup: async () => {},
    captureWorkspaceSnapshot: async () => ({ capturedAt: new Date().toISOString(), files: [] }),
  } as LocalExecutor;
}

function createAdapter(): HarnessAdapter {
  return {
    name: 'mock',
    buildCommand: () => ['mock'],
    parseOutput: (result: ExecResult) => ({ agentOutput: result.stdout, filesModified: [], transcript: result.stdout }),
    seedToolPermissions: async () => {},
  };
}
