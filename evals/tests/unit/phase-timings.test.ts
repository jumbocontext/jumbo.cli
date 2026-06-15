import { describe, it, expect } from '@jest/globals';
import { runABComparison } from '../../src/ab-runner.js';
import { createTestScenario } from '../../src/domain/types.js';
import type { ExecResult } from '../../src/infrastructure/container-manager.js';
import type { LocalExecutor } from '../../src/infrastructure/local-executor.js';
import type { HarnessAdapter } from '../../src/harness/harness-adapter.js';
import type { EvalRunRecord, RunHeartbeat, SessionRecord, TestResult } from '../../src/domain/types.js';
import type { ResultStore } from '../../src/storage/result-store.js';

describe('phase timings', () => {
  it('stamps successful session records with phaseTimings', async () => {
    const scenario = createTestScenario({
      id: 'scenario-timing',
      name: 'Timing',
      initialPrompt: 'Build',
      sessionCount: 1,
    });
    const store = createStore();

    const comparison = await runABComparison({
      scenario,
      adapter: createAdapter(),
      executor: createExecutor(),
      store,
    });

    const jumbo = comparison.jumboResult.sessionRecords[0];
    const baseline = comparison.baselineResult.sessionRecords[0];
    expect(jumbo.phaseTimings?.harnessExec.elapsedMs).toBeGreaterThan(0);
    expect(jumbo.phaseTimings?.lifecycleAudit?.elapsedMs).toBeGreaterThan(0);
    expect(baseline.phaseTimings?.harnessExec.elapsedMs).toBeGreaterThan(0);
    expect(baseline.phaseTimings?.lifecycleAudit).toBeUndefined();
  });
});

function createExecutor(): LocalExecutor {
  return {
    createWorkDir: async (prefix?: string) => `/tmp/${prefix ?? 'eval'}${Math.random()}`,
    installJumboShim: async (workDir: string) => ({ env: { PATH: `${workDir}/.eval-bin:/usr/bin` } }),
    exec: async (_workDir: string, command: string[], options?: { env?: Record<string, string | undefined> }) => {
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

function createStore(): ResultStore {
  return {
    saveScenario: async () => {},
    getScenario: async () => null,
    listScenarios: async () => [],
    saveSessionRecord: async () => {},
    getSessionRecords: async () => [],
    saveTestResult: async () => {},
    getTestResult: async () => null,
    listTestResults: async () => [],
    saveRunRecord: async (_record: EvalRunRecord) => {},
    getRunRecord: async () => null,
    listRunRecords: async () => [],
    writeHeartbeat: async (_runId: string, _heartbeat: RunHeartbeat) => {},
    readHeartbeat: async () => null,
  };
}
