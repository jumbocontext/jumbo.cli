import { describe, it, expect } from '@jest/globals';
import { createTestScenario } from '../../src/domain/types.js';
import { runSession } from '../../src/run-session.js';
import type { LocalExecutor } from '../../src/infrastructure/local-executor.js';
import type { ExecResult } from '../../src/infrastructure/container-manager.js';
import type { HarnessAdapter } from '../../src/harness/harness-adapter.js';
import type { ResultStore } from '../../src/storage/result-store.js';
import type { SessionRecord } from '../../src/domain/types.js';

function createMockExecutor(execResult: ExecResult): LocalExecutor {
  return {
    createWorkDir: async () => '/tmp/mock-workdir',
    exec: async () => execResult,
    cleanup: async () => {},
    captureWorkspaceSnapshot: async () => ({ capturedAt: new Date().toISOString(), files: [] }),
  } as LocalExecutor;
}

function createMockAdapter(): HarnessAdapter {
  return {
    name: 'mock-harness',
    buildCommand: () => ['mock'],
    parseOutput: (result: ExecResult) => ({
      agentOutput: result.stdout,
      filesModified: ['created-file.ts'],
      transcript: result.stdout,
    }),
    seedToolPermissions: async () => {},
  };
}

function createMockStore(): ResultStore & { savedRecords: SessionRecord[] } {
  const savedRecords: SessionRecord[] = [];
  return {
    savedRecords,
    saveScenario: async () => {},
    getScenario: async () => null,
    listScenarios: async () => [],
    saveSessionRecord: async (record: SessionRecord) => { savedRecords.push(record); },
    getSessionRecords: async () => [],
    saveTestResult: async () => {},
    getTestResult: async () => null,
    listTestResults: async () => [],
  };
}

describe('runSession', () => {
  it('orchestrates end-to-end: scenario -> harness exec -> store session record', async () => {
    const scenario = createTestScenario({
      id: 'scenario-1',
      name: 'Smoke test',
      initialPrompt: 'Create a hello world project',
      sessionCount: 1,
    });

    const executor = createMockExecutor({
      stdout: 'Hello world project created successfully',
      stderr: '',
      exitCode: 0,
    });

    const adapter = createMockAdapter();
    const store = createMockStore();

    const record = await runSession({
      scenario,
      sessionNumber: 1,
      variant: 'jumbo',
      prompt: 'Jumbo context\n\nCreate a hello world project',
      scenarioPrompt: 'Create a hello world project',
      deliveredContext: 'Jumbo context',
      workDir: '/tmp/mock-workdir',
      executor,
      adapter,
      store,
    });

    expect(record.scenarioId).toBe('scenario-1');
    expect(record.sessionNumber).toBe(1);
    expect(record.harness).toBe('mock-harness');
    expect(record.variant).toBe('jumbo');
    expect(record.scenarioPrompt).toBe('Create a hello world project');
    expect(record.effectivePrompt).toBe('Jumbo context\n\nCreate a hello world project');
    expect(record.deliveredContext).toBe('Jumbo context');
    expect(record.agentOutput).toBe('Hello world project created successfully');
    expect(record.filesModified).toEqual(['created-file.ts']);
    expect(record.startedAt).toBeDefined();
    expect(record.completedAt).toBeDefined();

    // Verify it was persisted
    expect(store.savedRecords).toHaveLength(1);
    expect(store.savedRecords[0].id).toBe(record.id);
  });
});
