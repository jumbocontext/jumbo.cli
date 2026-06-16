import { describe, it, expect } from '@jest/globals';
import { runABComparison, TamperAbortError } from '../../src/ab-runner.js';
import { createTestScenario } from '../../src/domain/types.js';
import type {
  ResultStore,
} from '../../src/storage/result-store.js';
import type {
  RunControlFile,
  SessionRecord,
  TestResult,
  EvalRunRecord,
  RunHeartbeat,
  TestScenario,
  TamperEvent,
} from '../../src/domain/types.js';
import type { LocalExecutor } from '../../src/infrastructure/local-executor.js';
import type { ExecResult } from '../../src/infrastructure/container-manager.js';
import type { HarnessAdapter } from '../../src/harness/harness-adapter.js';

interface MemoryStore extends ResultStore {
  readonly sessionRecords: SessionRecord[];
  readonly testResults: TestResult[];
  readonly control: Map<string, RunControlFile>;
}

function memoryStore(initialControl?: RunControlFile): MemoryStore {
  const sessionRecords: SessionRecord[] = [];
  const testResults: TestResult[] = [];
  const control = new Map<string, RunControlFile>();
  if (initialControl) control.set(initialControl.runId, initialControl);
  const runRecords: EvalRunRecord[] = [];
  const heartbeats = new Map<string, RunHeartbeat>();
  return {
    sessionRecords,
    testResults,
    control,
    saveScenario: async () => {},
    getScenario: async () => null,
    listScenarios: async () => [],
    saveSessionRecord: async (r) => {
      const idx = sessionRecords.findIndex((x) => x.id === r.id);
      if (idx >= 0) sessionRecords[idx] = r;
      else sessionRecords.push(r);
    },
    getSessionRecords: async () => sessionRecords,
    saveTestResult: async (r) => { testResults.push(r); },
    getTestResult: async () => null,
    listTestResults: async () => testResults,
    saveRunRecord: async (r) => { runRecords.push(r); },
    getRunRecord: async () => runRecords.at(-1) ?? null,
    listRunRecords: async () => runRecords,
    writeHeartbeat: async (runId, hb) => { heartbeats.set(runId, hb); },
    readHeartbeat: async (runId) => heartbeats.get(runId) ?? null,
    writeRunControl: async (runId, file) => { control.set(runId, file); },
    readRunControl: async (runId) => control.get(runId) ?? null,
  };
}

function execMock(): LocalExecutor & { calls: { workDir: string; command: string[] }[] } {
  const calls: { workDir: string; command: string[] }[] = [];
  let dir = 0;
  return {
    calls,
    createWorkDir: async (p?: string) => { dir++; return `/tmp/${p ?? 'd-'}${dir}`; },
    cleanup: async () => {},
    captureWorkspaceSnapshot: async () => ({ capturedAt: new Date().toISOString(), files: [] }),
    installJumboShim: async (workDir: string) => ({ env: { PATH: `${workDir}/.eval-bin:/usr/bin` } }),
    exec: async (workDir: string, command: string[], options?: { env?: Record<string, string | undefined> }) => {
      calls.push({ workDir, command });
      if (command[0] === 'jumbo' && command[1] === '--version') {
        const shimmed = options?.env?.PATH?.includes('.eval-bin') ?? false;
        return shimmed
          ? { stdout: '', stderr: 'shim', exitCode: 127 }
          : ok('jumbo 1.2.3');
      }
      if (command[0] === 'jumbo' && command[1] === 'init') return ok('initialized');
      if (command[0] === 'jumbo' && command[1] === 'goal' && command[2] === 'show') {
        return ok(JSON.stringify({ goal: { status: 'submitted' } }));
      }
      if (command[0] === 'jumbo' && command[1] === 'sessions' && command[2] === 'list') {
        return ok('[]');
      }
      if (command[0] === 'jumbo' && command[3] === '--format' && command[4] === 'json') {
        return ok('[]');
      }
      return ok(JSON.stringify({ result: 'done', files_modified: ['src/x.ts'] }));
    },
  } as unknown as LocalExecutor & { calls: { workDir: string; command: string[] }[] };
}

function ok(stdout: string): ExecResult {
  return { stdout, stderr: '', exitCode: 0 };
}

function adapterMock(): HarnessAdapter {
  return {
    name: 'mock-h',
    buildCommand: () => ['mock'],
    parseOutput: (r: ExecResult) => {
      try {
        const p = JSON.parse(r.stdout);
        return { agentOutput: p.result, filesModified: p.files_modified ?? [], transcript: r.stdout };
      } catch {
        return { agentOutput: r.stdout, filesModified: [], transcript: r.stdout };
      }
    },
    seedToolPermissions: async () => {},
  };
}

function scenario(sessionCount: number, opts: Partial<TestScenario> = {}): TestScenario {
  return createTestScenario({
    id: 's1',
    name: 'tamper test',
    initialPrompt: 'do work',
    continuationPrompt: 'continue',
    sessionCount,
    expectedFiles: ['src/x.ts'],
    ...opts,
  });
}

function controlFile(runId: string, partial: Partial<RunControlFile>): RunControlFile {
  return {
    runId,
    updatedAt: new Date().toISOString(),
    pendingActions: [],
    pauseRequested: false,
    abortRequested: false,
    ...partial,
  };
}

function tamperEvent(action: TamperEvent['action'], extra: Partial<TamperEvent> = {}): TamperEvent {
  return { occurredAt: new Date().toISOString(), action, ...extra };
}

describe('tamper quarantine', () => {
  it('abort halts before scoring and never writes a ComparisonResult', async () => {
    const runId = 'run-abort';
    const store = memoryStore(controlFile(runId, {
      pendingActions: [tamperEvent('abort', { operator: 'alice' })],
      abortRequested: true,
    }));
    await expect(runABComparison({
      scenario: scenario(3),
      adapter: adapterMock(),
      executor: execMock(),
      store,
      runId,
    })).rejects.toBeInstanceOf(TamperAbortError);
    expect(store.testResults).toHaveLength(0);
  });

  it('abort taints already-saved SessionRecords with abort event in the last record', async () => {
    const runId = 'run-abort-mid';
    const store = memoryStore();
    let firstSessionDone = false;
    const executor = execMock();
    const originalExec = executor.exec.bind(executor);
    executor.exec = async (workDir, command, options) => {
      const r = await originalExec(workDir, command, options);
      // After first jumbo session ends, plant an abort
      if (!firstSessionDone && command[0] === 'mock' && workDir.includes('jumbo-eval-jumbo-')) {
        firstSessionDone = true;
        await store.writeRunControl(runId, controlFile(runId, {
          pendingActions: [tamperEvent('abort')],
          abortRequested: true,
        }));
      }
      return r;
    };

    await expect(runABComparison({
      scenario: scenario(3),
      adapter: adapterMock(),
      executor,
      store,
      runId,
    })).rejects.toBeInstanceOf(TamperAbortError);

    const jumbo = store.sessionRecords.filter((r) => r.variant === 'jumbo');
    expect(jumbo.length).toBeGreaterThanOrEqual(1);
    expect(jumbo.every((r) => r.tampered)).toBe(true);
    const lastJumbo = jumbo[jumbo.length - 1];
    expect(lastJumbo.tamperLog.some((e) => e.action === 'abort')).toBe(true);
    expect(store.testResults).toHaveLength(0);
  });

  it('inject-context appends only to the next jumbo session deliveredContext', async () => {
    const runId = 'run-inject';
    const store = memoryStore();
    const executor = execMock();
    let firstSessionEnded = false;
    const originalExec = executor.exec.bind(executor);
    executor.exec = async (workDir, command, options) => {
      const r = await originalExec(workDir, command, options);
      if (!firstSessionEnded && command[0] === 'mock' && workDir.includes('jumbo-eval-jumbo-')) {
        firstSessionEnded = true;
        await store.writeRunControl(runId, controlFile(runId, {
          pendingActions: [tamperEvent('inject-context', {
            payload: 'remember edge case Q',
            variant: 'jumbo',
          })],
        }));
      }
      return r;
    };

    await runABComparison({
      scenario: scenario(2),
      adapter: adapterMock(),
      executor,
      store,
      runId,
    });

    const jumbo = store.sessionRecords.filter((r) => r.variant === 'jumbo').sort((a, b) => a.sessionNumber - b.sessionNumber);
    const baseline = store.sessionRecords.filter((r) => r.variant === 'baseline').sort((a, b) => a.sessionNumber - b.sessionNumber);

    expect(jumbo[0].deliveredContext ?? '').not.toContain('edge case Q');
    expect(jumbo[1].deliveredContext ?? '').toContain('OPERATOR-INJECTED CONTEXT');
    expect(jumbo[1].deliveredContext ?? '').toContain('remember edge case Q');
    // scenarioPrompt unchanged
    expect(jumbo[1].scenarioPrompt).toBe('continue');
    // baseline never sees the injection
    for (const b of baseline) {
      expect(b.deliveredContext).toBeUndefined();
    }
  });

  it('tamper taint propagates forward to all later sessions in the variant', async () => {
    const runId = 'run-taint';
    const store = memoryStore();
    const executor = execMock();
    let firstEnded = false;
    const originalExec = executor.exec.bind(executor);
    executor.exec = async (workDir, command, options) => {
      const r = await originalExec(workDir, command, options);
      if (!firstEnded && command[0] === 'mock' && workDir.includes('jumbo-eval-jumbo-')) {
        firstEnded = true;
        await store.writeRunControl(runId, controlFile(runId, {
          pendingActions: [tamperEvent('inject-context', {
            payload: 'taint',
            variant: 'jumbo',
          })],
        }));
      }
      return r;
    };

    await runABComparison({
      scenario: scenario(3),
      adapter: adapterMock(),
      executor,
      store,
      runId,
    });

    const jumbo = store.sessionRecords
      .filter((r) => r.variant === 'jumbo')
      .sort((a, b) => a.sessionNumber - b.sessionNumber);
    const baseline = store.sessionRecords
      .filter((r) => r.variant === 'baseline')
      .sort((a, b) => a.sessionNumber - b.sessionNumber);

    expect(jumbo[0].tampered).toBe(false);
    expect(jumbo[1].tampered).toBe(true);
    expect(jumbo[2].tampered).toBe(true);
    expect(jumbo[1].tamperLog).toHaveLength(1);
    expect(jumbo[2].tamperLog).toHaveLength(0); // event recorded only on the immediate next; taint flag is sticky
    // baseline is untouched
    expect(baseline.every((r) => !r.tampered)).toBe(true);
  });

  it('TestResult and ComparisonResult are tampered when any session is tampered', async () => {
    const runId = 'run-cmp';
    const store = memoryStore();
    const executor = execMock();
    let firstEnded = false;
    const originalExec = executor.exec.bind(executor);
    executor.exec = async (workDir, command, options) => {
      const r = await originalExec(workDir, command, options);
      if (!firstEnded && command[0] === 'mock' && workDir.includes('jumbo-eval-jumbo-')) {
        firstEnded = true;
        await store.writeRunControl(runId, controlFile(runId, {
          pendingActions: [tamperEvent('inject-context', {
            payload: 'q',
            variant: 'jumbo',
          })],
        }));
      }
      return r;
    };

    const cmp = await runABComparison({
      scenario: scenario(2),
      adapter: adapterMock(),
      executor,
      store,
      runId,
    });
    expect(cmp.tampered).toBe(true);
    expect(cmp.tamperLog.length).toBeGreaterThan(0);
    expect(cmp.jumboResult.tampered).toBe(true);
    expect(cmp.baselineResult.tampered).toBe(false);
  });

  it('pause blocks at the session boundary until resume clears pauseRequested', async () => {
    const runId = 'run-pause';
    const store = memoryStore(controlFile(runId, {
      pendingActions: [tamperEvent('pause')],
      pauseRequested: true,
    }));
    setTimeout(() => {
      void store.writeRunControl(runId, controlFile(runId, {
        pendingActions: [tamperEvent('resume')],
        pauseRequested: false,
      }));
    }, 1200);

    const start = Date.now();
    await runABComparison({
      scenario: scenario(1),
      adapter: adapterMock(),
      executor: execMock(),
      store,
      runId,
    });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(1000);
    const jumbo = store.sessionRecords.filter((r) => r.variant === 'jumbo');
    expect(jumbo[0].tampered).toBe(true);
    expect(jumbo[0].tamperLog.some((e) => e.action === 'pause')).toBe(true);
    expect(jumbo[0].tamperLog.some((e) => e.action === 'resume')).toBe(true);
  }, 15000);

  it('aggregate scoring excludes tampered jumbo records by default', async () => {
    const runId = 'run-score';
    const store = memoryStore();
    const executor = execMock();
    // Pre-plant inject-context so session 2 will be tainted
    await store.writeRunControl(runId, controlFile(runId, {
      pendingActions: [tamperEvent('inject-context', {
        payload: 'q',
        variant: 'jumbo',
      })],
    }));
    // The control fires before session 1; that taints session 1+. Use 1-session scenario:
    const cmp = await runABComparison({
      scenario: scenario(1),
      adapter: adapterMock(),
      executor,
      store,
      runId,
    });
    // Only jumbo session is tainted; baseline is not. file-accuracy: baseline modified expected file -> 1.0; jumbo records are filtered out -> 0 (no records vs expected).
    const fileAcc = cmp.deltas.find((d) => d.dimension === 'file-accuracy');
    expect(fileAcc).toBeDefined();
    // jumbo aggregate excluded -> jumbo score 0; baseline score 1
    expect(cmp.jumboScores.find((s) => s.dimension === 'file-accuracy')?.score).toBe(0);
    expect(cmp.baselineScores.find((s) => s.dimension === 'file-accuracy')?.score).toBe(1);
  });
});
