import { describe, it, expect, jest } from '@jest/globals';
import { runABComparison } from '../../src/ab-runner.js';
import { formatHeartbeatDisplay } from '../../src/output/heartbeat-display.js';
import { createTestScenario } from '../../src/domain/types.js';
import type { ExecResult } from '../../src/infrastructure/container-manager.js';
import type { HeartbeatWriter } from '../../src/infrastructure/heartbeat-writer.js';
import type { LocalExecutor } from '../../src/infrastructure/local-executor.js';
import type { HarnessAdapter } from '../../src/harness/harness-adapter.js';
import type { EvalRunRecord, RunHeartbeat, SessionRecord, TestResult } from '../../src/domain/types.js';
import type { ResultStore } from '../../src/storage/result-store.js';

describe('heartbeat emission', () => {
  it('emits phase transitions for jumbo and baseline variants', async () => {
    const writer = createWriter();
    await runABComparison({
      scenario: createTestScenario({ id: 'scenario-heartbeat', name: 'Heartbeat', initialPrompt: 'Build', sessionCount: 1 }),
      adapter: createAdapter(),
      executor: createExecutor(),
      store: createStore(),
      runId: 'run-heartbeat',
      heartbeatWriter: writer,
    });

    const transitions = writer.heartbeats.flatMap((heartbeat) =>
      heartbeat.harnesses.flatMap((harness) =>
        harness.sessions.map((session) => `${harness.variant}:${session.status}:${session.phase ?? 'none'}`),
      ),
    );

    expect(transitions).toEqual(expect.arrayContaining([
      'jumbo:running:harness-exec',
      'jumbo:running:lifecycle-audit',
      'jumbo:completed:none',
      'baseline:running:harness-exec',
      'baseline:completed:none',
    ]));
  });

  it('never reads heartbeat state inside runABComparison', async () => {
    const store = createStore();
    const readHeartbeat = jest.spyOn(store, 'readHeartbeat');

    await runABComparison({
      scenario: createTestScenario({ id: 'scenario-read', name: 'No reads', initialPrompt: 'Build', sessionCount: 1 }),
      adapter: createAdapter(),
      executor: createExecutor(),
      store,
    });

    expect(readHeartbeat).not.toHaveBeenCalled();
  });

  it('does not change persisted artifacts except nondeterministic timing fields', async () => {
    const scenario = createTestScenario({ id: 'scenario-equal', name: 'Equal', initialPrompt: 'Build', sessionCount: 1 });
    const disabledStore = createStore();
    const enabledStore = createStore();

    await runABComparison({
      scenario,
      adapter: createAdapter(),
      executor: createExecutor(),
      store: disabledStore,
      runId: 'run-disabled',
    });
    await runABComparison({
      scenario,
      adapter: createAdapter(),
      executor: createExecutor(),
      store: enabledStore,
      runId: 'run-enabled',
      heartbeatWriter: createWriter(),
    });

    expect(normalizePersistedArtifacts(enabledStore)).toEqual(normalizePersistedArtifacts(disabledStore));
  });

  it('marks both variants failed when scoring persistence fails', async () => {
    const writer = createWriter();

    await expect(runABComparison({
      scenario: createTestScenario({ id: 'scenario-score-fail', name: 'Score fail', initialPrompt: 'Build', sessionCount: 1 }),
      adapter: createAdapter(),
      executor: createExecutor(),
      store: createStore({ failSaveTestResult: true }),
      runId: 'run-score-fail',
      heartbeatWriter: writer,
    })).rejects.toThrow('save failed');

    const failedScoring = writer.heartbeats
      .flatMap((heartbeat) => heartbeat.harnesses)
      .flatMap((harness) => harness.sessions.map((session) => `${harness.variant}:${session.status}:${session.phase}:${session.errorMessage}`))
      .filter((transition) => transition.includes(':failed:scoring:'));
    expect(failedScoring).toEqual(expect.arrayContaining([
      'jumbo:failed:scoring:save failed',
      'baseline:failed:scoring:save failed',
    ]));
  });

  it('renders per-session heartbeat rows', () => {
    const output = formatHeartbeatDisplay({
      runId: 'run-display',
      scenarioId: 'scenario-display',
      updatedAt: '2026-04-29T10:00:00.000Z',
      harnesses: [{
        harness: 'claude-code',
        variant: 'jumbo',
        sessions: [
          { sessionNumber: 1, status: 'completed', startedAt: '2026-04-29T10:00:00.000Z', completedAt: '2026-04-29T10:00:01.000Z' },
          { sessionNumber: 2, status: 'running', phase: 'harness-exec', startedAt: new Date().toISOString() },
          { sessionNumber: 3, status: 'pending' },
        ],
      }],
    });

    expect(output).toContain('Sessions');
    expect(output).toContain('claude-code');
    expect(output).toContain('jumbo');
    expect(output).toContain('completed');
    expect(output).toContain('running');
    expect(output).toContain('harness-exec');
    expect(output).toContain('pending');
  });
});

function createWriter(): HeartbeatWriter & { heartbeats: RunHeartbeat[] } {
  return {
    heartbeats: [],
    async writeHeartbeat(_runId: string, heartbeat: RunHeartbeat): Promise<void> {
      this.heartbeats.push(heartbeat);
    },
  };
}

function normalizePersistedArtifacts(store: RecordingStore): unknown {
  return {
    sessions: store.sessionRecords.map(normalizeSession),
    testResults: store.testResults.map(normalizeTestResult),
  };
}

function normalizeTestResult(result: TestResult): unknown {
  return {
    ...result,
    id: '<id>',
    createdAt: '<time>',
    sessionRecords: result.sessionRecords.map(normalizeSession),
  };
}

function normalizeSession(record: SessionRecord): unknown {
  return {
    ...record,
    id: '<id>',
    startedAt: '<time>',
    completedAt: '<time>',
    workspaceSnapshot: record.workspaceSnapshot ? { ...record.workspaceSnapshot, capturedAt: '<time>' } : undefined,
    jumboMemorySnapshot: record.jumboMemorySnapshot ? { ...record.jumboMemorySnapshot, capturedAt: '<time>' } : undefined,
    jumboMemorySnapshotBefore: record.jumboMemorySnapshotBefore ? { ...record.jumboMemorySnapshotBefore, capturedAt: '<time>' } : undefined,
    phaseTimings: '<timing>',
  };
}

function createExecutor(): LocalExecutor & { execCalls: Array<{ command: string[] }> } {
  let dir = 0;
  const execCalls: Array<{ command: string[] }> = [];
  return {
    execCalls,
    createWorkDir: async (prefix?: string) => `/tmp/${prefix ?? 'eval'}${++dir}`,
    installJumboShim: async (workDir: string) => ({ env: { PATH: `${workDir}/.eval-bin:/usr/bin` } }),
    exec: async (_workDir: string, command: string[], options?: { env?: Record<string, string | undefined> }) => {
      execCalls.push({ command });
      if (command[0] === 'jumbo' && command[1] === '--version') {
        const shimmed = options?.env?.PATH?.includes('.eval-bin') ?? false;
        return shimmed
          ? { stdout: '', stderr: 'shim', exitCode: 127 }
          : { stdout: 'jumbo 1.2.3', stderr: '', exitCode: 0 };
      }
      if (command[0] === 'jumbo' && command[1] === 'goal' && command[2] === 'show') {
        return { stdout: JSON.stringify({ goal: { status: 'submitted' } }), stderr: '', exitCode: 0 };
      }
      if (command[0] === 'jumbo' && command[1] === 'sessions' && command[2] === 'list') {
        return { stdout: '[]', stderr: '', exitCode: 0 };
      }
      if (command[0] === 'jumbo' && command[3] === '--format') {
        return { stdout: '[]', stderr: '', exitCode: 0 };
      }
      if (command[0] === 'mock') {
        return { stdout: '{"result":"ok","files_modified":[]}', stderr: '', exitCode: 0 };
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

function createStore(options?: { failSaveTestResult?: boolean }): RecordingStore {
  return new RecordingStore(options);
}

class RecordingStore implements ResultStore {
  readonly sessionRecords: SessionRecord[] = [];
  readonly testResults: TestResult[] = [];

  constructor(private readonly options?: { failSaveTestResult?: boolean }) {}

  async saveScenario(): Promise<void> {}
  async getScenario(): Promise<null> { return null; }
  async listScenarios(): Promise<[]> { return []; }

  async saveSessionRecord(record: SessionRecord): Promise<void> {
    const index = this.sessionRecords.findIndex((existing) => existing.id === record.id);
    if (index === -1) {
      this.sessionRecords.push(record);
    } else {
      this.sessionRecords[index] = record;
    }
  }

  async getSessionRecords(): Promise<SessionRecord[]> {
    return [...this.sessionRecords];
  }

  async saveTestResult(result: TestResult): Promise<void> {
    if (this.options?.failSaveTestResult) {
      throw new Error('save failed');
    }
    this.testResults.push(result);
  }

  async getTestResult(): Promise<null> { return null; }
  async listTestResults(): Promise<TestResult[]> { return [...this.testResults]; }
  async saveRunRecord(_record: EvalRunRecord): Promise<void> {}
  async getRunRecord(): Promise<null> { return null; }
  async listRunRecords(): Promise<[]> { return []; }
  async writeHeartbeat(_runId: string, _heartbeat: RunHeartbeat): Promise<void> {}
  async readHeartbeat(): Promise<null> { return null; }
}
