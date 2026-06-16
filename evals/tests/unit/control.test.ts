import { describe, it, expect } from '@jest/globals';
import { Command } from 'commander';
import { registerControlCommand } from '../../src/cli/commands/control.js';
import type { RunControlFile } from '../../src/domain/types.js';
import type { ResultStore } from '../../src/storage/result-store.js';

function makeMemoryStore(): ResultStore & { control: Map<string, RunControlFile> } {
  const control = new Map<string, RunControlFile>();
  const store: Partial<ResultStore> & { control: Map<string, RunControlFile> } = {
    control,
    saveScenario: async () => {},
    getScenario: async () => null,
    listScenarios: async () => [],
    saveSessionRecord: async () => {},
    getSessionRecords: async () => [],
    saveTestResult: async () => {},
    getTestResult: async () => null,
    listTestResults: async () => [],
    saveRunRecord: async () => {},
    getRunRecord: async () => null,
    listRunRecords: async () => [],
    writeHeartbeat: async () => {},
    readHeartbeat: async () => null,
    writeRunControl: async (runId: string, file: RunControlFile) => {
      control.set(runId, file);
    },
    readRunControl: async (runId: string) => control.get(runId) ?? null,
  };
  return store as ResultStore & { control: Map<string, RunControlFile> };
}

function buildProgram(store: ResultStore): Command {
  const program = new Command();
  program.exitOverride();
  registerControlCommand(program, { storeProvider: async () => store });
  return program;
}

describe('eval control', () => {
  it('refuses mutating actions without --allow-tampering', async () => {
    const store = makeMemoryStore();
    const program = buildProgram(store);
    await expect(program.parseAsync(['node', 'eval', 'control', 'run-1', 'pause']))
      .rejects.toThrow(/--allow-tampering/);
    expect(store.control.size).toBe(0);
  });

  it('rejects unknown actions', async () => {
    const store = makeMemoryStore();
    const program = buildProgram(store);
    await expect(program.parseAsync(['node', 'eval', 'control', 'run-1', 'flip', '--allow-tampering']))
      .rejects.toThrow(/Unknown control action/);
  });

  it('records pause action with pauseRequested=true', async () => {
    const store = makeMemoryStore();
    const program = buildProgram(store);
    await program.parseAsync(['node', 'eval', 'control', 'run-1', 'pause', '--allow-tampering']);
    const file = store.control.get('run-1');
    expect(file?.pauseRequested).toBe(true);
    expect(file?.abortRequested).toBe(false);
    expect(file?.pendingActions).toHaveLength(1);
    expect(file?.pendingActions[0].action).toBe('pause');
  });

  it('resume clears pauseRequested', async () => {
    const store = makeMemoryStore();
    const program = buildProgram(store);
    await program.parseAsync(['node', 'eval', 'control', 'run-1', 'pause', '--allow-tampering']);
    const program2 = buildProgram(store);
    await program2.parseAsync(['node', 'eval', 'control', 'run-1', 'resume', '--allow-tampering']);
    const file = store.control.get('run-1');
    expect(file?.pauseRequested).toBe(false);
    expect(file?.pendingActions.map((e) => e.action)).toEqual(['pause', 'resume']);
  });

  it('abort sets abortRequested', async () => {
    const store = makeMemoryStore();
    const program = buildProgram(store);
    await program.parseAsync([
      'node', 'eval', 'control', 'run-1', 'abort',
      '--allow-tampering', '--operator', 'alice',
    ]);
    const file = store.control.get('run-1');
    expect(file?.abortRequested).toBe(true);
    expect(file?.pendingActions[0].operator).toBe('alice');
  });

  it('inject-context requires a payload', async () => {
    const store = makeMemoryStore();
    const program = buildProgram(store);
    await expect(program.parseAsync([
      'node', 'eval', 'control', 'run-1', 'inject-context',
      '--allow-tampering',
    ])).rejects.toThrow(/payload/);
  });

  it('inject-context refuses --variant baseline', async () => {
    const store = makeMemoryStore();
    const program = buildProgram(store);
    await expect(program.parseAsync([
      'node', 'eval', 'control', 'run-1', 'inject-context', 'remember X',
      '--allow-tampering', '--variant', 'baseline',
    ])).rejects.toThrow(/jumbo variant/);
  });

  it('inject-context defaults variant to jumbo and stores payload', async () => {
    const store = makeMemoryStore();
    const program = buildProgram(store);
    await program.parseAsync([
      'node', 'eval', 'control', 'run-1', 'inject-context', 'edge case Y',
      '--allow-tampering',
    ]);
    const file = store.control.get('run-1');
    expect(file?.pendingActions).toHaveLength(1);
    expect(file?.pendingActions[0].action).toBe('inject-context');
    expect(file?.pendingActions[0].payload).toBe('edge case Y');
    expect(file?.pendingActions[0].variant).toBe('jumbo');
    expect(file?.pauseRequested).toBe(false);
    expect(file?.abortRequested).toBe(false);
  });

  it('appends multiple pending actions across invocations', async () => {
    const store = makeMemoryStore();
    await buildProgram(store).parseAsync([
      'node', 'eval', 'control', 'run-1', 'inject-context', 'first',
      '--allow-tampering',
    ]);
    await buildProgram(store).parseAsync([
      'node', 'eval', 'control', 'run-1', 'inject-context', 'second',
      '--allow-tampering',
    ]);
    expect(store.control.get('run-1')?.pendingActions.map((e) => e.payload)).toEqual(['first', 'second']);
  });
});
