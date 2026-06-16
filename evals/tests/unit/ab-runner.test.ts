import { describe, it, expect } from '@jest/globals';
import {
  buildJumboLifecyclePrompt,
  JumboBaselineLeakError,
  JumboInitError,
  JumboPlanGoalRegistrationError,
  JumboPlanSeedError,
  JumboReachabilityError,
  getSessionPrompt,
  runABComparison,
} from '../../src/ab-runner.js';
import { createTestScenario } from '../../src/domain/types.js';
import type { LocalExecutor } from '../../src/infrastructure/local-executor.js';
import type { ExecResult } from '../../src/infrastructure/container-manager.js';
import type { HarnessAdapter } from '../../src/harness/harness-adapter.js';
import type { ResultStore } from '../../src/storage/result-store.js';
import type { SessionRecord, TestResult } from '../../src/domain/types.js';
import { ClaudeCodeAdapter } from '../../src/harness/claude-code-adapter.js';
import { CodexCliAdapter } from '../../src/harness/codex-cli-adapter.js';
import { GeminiCliAdapter } from '../../src/harness/gemini-cli-adapter.js';

function createMockExecutor(options?: {
  failJumboInit?: boolean;
  // Force `jumbo --version` to fail in the jumbo arm (or both). Baseline
  // always fails by default because the shim is installed; pass
  // `baselineJumboLeak: true` to simulate a leak where baseline jumbo is
  // unexpectedly reachable despite the shim.
  failJumboVersion?: 'jumbo' | 'both';
  baselineJumboLeak?: boolean;
  jumboMemoryOutputs?: Partial<Record<string, unknown>>;
  goalAddIds?: readonly string[];
  failJumboPlanEntry?: 'decision' | 'component' | 'invariant' | 'dependency' | 'relation';
  goalShowStatusBefore?: string;
  goalShowStatusAfter?: string;
  goalVersionBefore?: number;
  goalVersionAfter?: number;
  sessionsTotalBefore?: number;
  sessionsTotalAfter?: number;
  sessionsEndedBefore?: number;
  sessionsEndedAfter?: number;
}): LocalExecutor & {
  execCalls: Array<{ workDir: string; command: string[]; stdin?: string; env?: Record<string, string | undefined> }>;
  shimInstalledFor: string[];
} {
  const execCalls: Array<{ workDir: string; command: string[]; stdin?: string; env?: Record<string, string | undefined> }> = [];
  const shimInstalledFor: string[] = [];
  let dirCounter = 0;
  let goalAddCount = 0;
  // Tracks how many lifecycle-audit "goal show" calls have run per workDir.
  // Odd calls are pre-harness snapshots; even calls are post-harness audits.
  const goalShowCallsByDir = new Map<string, number>();
  const sessionsAllCallsByDir = new Map<string, number>();
  const sessionsEndedCallsByDir = new Map<string, number>();
  // First memory-list call for a given (workDir, kind) is the pre-snapshot;
  // subsequent calls are post-snapshot (or the lifecycle audit's decisions
  // list). The agent's "registrations" are encoded as the diff: pre returns
  // empty, post returns the configured output.
  const memoryListCallsByDirKind = new Map<string, number>();

  return {
    execCalls,
    shimInstalledFor,
    createWorkDir: async (prefix?: string) => {
      dirCounter++;
      return `/tmp/${prefix ?? 'eval-'}${dirCounter}`;
    },
    installJumboShim: async (workDir: string) => {
      shimInstalledFor.push(workDir);
      return { env: { PATH: `${workDir}/.eval-bin:/usr/bin` } };
    },
    exec: async (workDir: string, command: string[], execOptions?: { stdin?: string; env?: Record<string, string | undefined> }) => {
      execCalls.push({ workDir, command, stdin: execOptions?.stdin, env: execOptions?.env });
      if (command[0] === 'jumbo' && command[1] === '--version') {
        const isJumboArm = workDir.includes('jumbo-eval-jumbo-');
        const shimmed = execOptions?.env?.PATH?.includes('.eval-bin') ?? false;
        // Jumbo arm: real binary unless test forces failure.
        // Baseline arm: shim fails loudly unless test forces a leak.
        const fail = isJumboArm
          ? (options?.failJumboVersion === 'both' || options?.failJumboVersion === 'jumbo')
          : (shimmed && !options?.baselineJumboLeak);
        if (fail) {
          return {
            stdout: '',
            stderr: shimmed
              ? 'ERROR: jumbo is not available in the baseline arm (eval shim)'
              : 'jumbo: command not found',
            exitCode: 127,
          };
        }
        return {
          stdout: 'jumbo 1.2.3',
          stderr: '',
          exitCode: 0,
        };
      }
      if (command[0] === 'jumbo' && command[1] === 'init') {
        return {
          stdout: options?.failJumboInit ? '' : 'jumbo initialized',
          stderr: options?.failJumboInit ? 'init failed' : '',
          exitCode: options?.failJumboInit ? 2 : 0,
        };
      }
      if (command[0] === 'jumbo' && command[1] === 'goal' && command[2] === 'show') {
        const count = (goalShowCallsByDir.get(workDir) ?? 0) + 1;
        goalShowCallsByDir.set(workDir, count);
        const before = count % 2 === 1; // first call per session is pre
        const status = before
          ? (options?.goalShowStatusBefore ?? 'refined')
          : (options?.goalShowStatusAfter ?? 'submitted');
        const version = before
          ? options?.goalVersionBefore
          : options?.goalVersionAfter;
        const id = command[command.indexOf('--id') + 1];
        const goalPayload: Record<string, unknown> = { goalId: id, status };
        if (version !== undefined) goalPayload.version = version;
        return {
          stdout: JSON.stringify({ goal: goalPayload }),
          stderr: '',
          exitCode: 0,
        };
      }
      if (command[0] === 'jumbo' && command[1] === 'sessions' && command[2] === 'list') {
        const statusIdx = command.indexOf('--status');
        const statusFilter = statusIdx >= 0 ? command[statusIdx + 1] : 'all';
        const map = statusFilter === 'ended' ? sessionsEndedCallsByDir : sessionsAllCallsByDir;
        const count = (map.get(workDir) ?? 0) + 1;
        map.set(workDir, count);
        const before = count % 2 === 1;
        const total = statusFilter === 'ended'
          ? (before ? options?.sessionsEndedBefore ?? 0 : options?.sessionsEndedAfter ?? 1)
          : (before ? options?.sessionsTotalBefore ?? 0 : options?.sessionsTotalAfter ?? 1);
        const items = Array.from({ length: total }, (_, i) => ({ sessionId: `s-${i + 1}` }));
        return { stdout: JSON.stringify(items), stderr: '', exitCode: 0 };
      }
      if (command[0] === 'jumbo' && command[3] === '--format' && command[4] === 'json') {
        const kind = command[1];
        const callKey = `${workDir}::${kind}`;
        const count = (memoryListCallsByDirKind.get(callKey) ?? 0) + 1;
        memoryListCallsByDirKind.set(callKey, count);
        // Pre-snapshot is empty; post-snapshot and audit reads return the
        // configured output. The scorer credits the diff (post - pre) only.
        const output = count === 1 ? [] : (options?.jumboMemoryOutputs?.[kind] ?? []);
        return {
          stdout: JSON.stringify(output),
          stderr: '',
          exitCode: 0,
        };
      }
      if (command[0] === 'jumbo' && command[1] === 'goal' && command[2] === 'add') {
        const id = options?.goalAddIds?.[goalAddCount] ?? `mock-goal-${goalAddCount + 1}`;
        goalAddCount++;
        return {
          stdout: JSON.stringify({ goalId: id }),
          stderr: '',
          exitCode: 0,
        };
      }
      if (
        command[0] === 'jumbo' &&
        command[2] === 'add' &&
        ['decision', 'component', 'invariant', 'dependency', 'relation'].includes(command[1])
      ) {
        const fail = options?.failJumboPlanEntry === command[1];
        return {
          stdout: fail ? '' : 'added',
          stderr: fail ? `${command[1]} add failed` : '',
          exitCode: fail ? 2 : 0,
        };
      }
      return {
        stdout: JSON.stringify({
          result: 'Task completed',
          files_modified: ['src/index.ts', 'src/utils.ts'],
        }),
        stderr: '',
        exitCode: 0,
      };
    },
    cleanup: async () => {},
    captureWorkspaceSnapshot: async () => ({ capturedAt: new Date().toISOString(), files: [] }),
  } as LocalExecutor & {
    execCalls: Array<{ workDir: string; command: string[]; stdin?: string; env?: Record<string, string | undefined> }>;
    shimInstalledFor: string[];
  };
}

function createMockAdapter(overrides?: Partial<HarnessAdapter>): HarnessAdapter & { seededDirs: string[] } {
  const seededDirs: string[] = [];
  return {
    seededDirs,
    name: 'mock-harness',
    buildCommand: () => ['mock'],
    parseOutput: (result: ExecResult) => {
      try {
        const parsed = JSON.parse(result.stdout);
        return {
          agentOutput: parsed.result ?? result.stdout,
          filesModified: parsed.files_modified ?? [],
          transcript: result.stdout,
        };
      } catch {
        return { agentOutput: result.stdout, filesModified: [], transcript: result.stdout };
      }
    },
    seedToolPermissions: async (workDir: string) => { seededDirs.push(workDir); },
    ...overrides,
  } as HarnessAdapter & { seededDirs: string[] };
}

function createMockStore(): ResultStore {
  const records: SessionRecord[] = [];
  const results: TestResult[] = [];
  return {
    saveScenario: async () => {},
    getScenario: async () => null,
    listScenarios: async () => [],
    saveSessionRecord: async (r: SessionRecord) => { records.push(r); },
    getSessionRecords: async () => records,
    saveTestResult: async (r: TestResult) => { results.push(r); },
    getTestResult: async () => null,
    listTestResults: async () => results,
  };
}

describe('runABComparison', () => {
  it('creates two separate working directories', async () => {
    const scenario = createTestScenario({
      id: 'scenario-1',
      name: 'Test scenario',
      initialPrompt: 'Build something',
      sessionCount: 1,
      expectedFiles: ['src/index.ts', 'src/utils.ts'],
    });

    const executor = createMockExecutor();
    const adapter = createMockAdapter();
    const store = createMockStore();

    await runABComparison({ scenario, adapter, executor, store });

    // Jumbo calls go to dir 1, baseline calls go to dir 2
    const workDirs = new Set(executor.execCalls.map((c) => c.workDir));
    expect(workDirs.size).toBe(2);
  });

  it('uses identical scenario prompts for both runs before variant wrapping', async () => {
    // Without a jumboPlan, the Jumbo arm has no active goal-id, so its
    // prompt is the bare scenario prompt — byte-identical to baseline.
    const scenario = createTestScenario({
      id: 'scenario-1',
      name: 'Test',
      initialPrompt: 'Build a hello world',
      sessionCount: 1,
    });

    const executor = createMockExecutor();
    const adapter = createMockAdapter();
    const store = createMockStore();

    await runABComparison({ scenario, adapter, executor, store });

    const harnessExecs = executor.execCalls.filter((c) => c.command[0] === 'mock');
    expect(harnessExecs).toHaveLength(2);
    // Prompt is delivered via stdin, not argv (cmd.exe newline-truncation fix).
    expect(harnessExecs[0].stdin).toBe('Build a hello world');
    expect(harnessExecs[1].stdin).toBe('Build a hello world');
  });

  it('wraps the Jumbo arm prompt with the lifecycle protocol when an active goal-id exists', async () => {
    const scenario = createTestScenario({
      id: 'scenario-lifecycle',
      name: 'Lifecycle prompt',
      initialPrompt: 'Build a hello world',
      sessionCount: 1,
      jumboPlan: {
        goals: [{
          title: 'Foundations',
          objective: 'Set up the project',
          criteria: ['scaffold exists'],
          sessionAvailableFrom: 1,
        }],
      },
    });
    const executor = createMockExecutor({ goalAddIds: ['gid-only'] });
    const adapter = createMockAdapter();
    const store = createMockStore();

    await runABComparison({ scenario, adapter, executor, store });

    const harnessExecs = executor.execCalls.filter((c) => c.command[0] === 'mock');
    expect(harnessExecs).toHaveLength(2);

    const jumboStdin = harnessExecs[0].stdin ?? '';
    expect(jumboStdin).toContain('Active goal for this session: gid-only');
    expect(jumboStdin).toContain('Jumbo lifecycle protocol');
    expect(jumboStdin).toContain('jumbo session start');
    expect(jumboStdin).toContain('jumbo goal start --id gid-only');
    expect(jumboStdin).toContain('jumbo goal submit --id gid-only');
    expect(jumboStdin).toContain('jumbo session end');
    expect(jumboStdin).toContain('Build a hello world');

    // Baseline never sees the lifecycle protocol.
    const baselineStdin = harnessExecs[1].stdin ?? '';
    expect(baselineStdin).toBe('Build a hello world');
    expect(baselineStdin).not.toContain('Jumbo lifecycle protocol');
  });

  it('populates filesModified from workspace-diff fallback when the adapter returns none', async () => {
    // Claude/Codex/Gemini CLIs do not surface a files_modified field reliably,
    // so the adapter parse yields []. The pre/post workspace snapshot diff
    // must be the source of truth for what the agent actually wrote on disk.
    const scenario = createTestScenario({
      id: 'scenario-diff',
      name: 'Diff test',
      initialPrompt: 'Build',
      sessionCount: 1,
    });

    // Adapter that always returns empty filesModified, simulating Claude CLI
    const emptyAdapter: HarnessAdapter = {
      name: 'empty-adapter',
      buildCommand: () => ['mock'],
      parseOutput: (result: ExecResult) => ({
        agentOutput: result.stdout,
        filesModified: [],
        transcript: result.stdout,
      }),
      seedToolPermissions: async () => {},
    };

    // Executor whose snapshots differ before/after each harness exec.
    // Pre-snapshot has only setup.md; post-snapshot adds two new files
    // and modifies setup.md content — the diff is exactly those three paths.
    const baseExec = createMockExecutor();
    let snapshotCall = 0;
    const diffExecutor = {
      ...baseExec,
      captureWorkspaceSnapshot: async () => {
        snapshotCall++;
        // Odd calls are pre-exec (1 file), even calls are post-exec (3 files w/ change)
        if (snapshotCall % 2 === 1) {
          return {
            capturedAt: '2026-05-01T00:00:00.000Z',
            files: [{ path: 'setup.md', content: 'initial' }],
          };
        }
        return {
          capturedAt: '2026-05-01T00:00:01.000Z',
          files: [
            { path: 'setup.md', content: 'edited' },
            { path: 'src/index.ts', content: 'export {}' },
            { path: 'src/utils.ts', content: 'export const x = 1' },
          ],
        };
      },
    } as LocalExecutor;

    const store = createMockStore();
    const result = await runABComparison({
      scenario,
      adapter: emptyAdapter,
      executor: diffExecutor,
      store,
    });

    const jumboRecord = result.jumboResult.sessionRecords[0];
    const baselineRecord = result.baselineResult.sessionRecords[0];

    expect(jumboRecord.filesModified).toEqual(['setup.md', 'src/index.ts', 'src/utils.ts']);
    expect(baselineRecord.filesModified).toEqual(['setup.md', 'src/index.ts', 'src/utils.ts']);
  });

  it('preserves adapter-reported filesModified when present (does not overwrite with diff)', async () => {
    const scenario = createTestScenario({
      id: 'scenario-adapter-priority',
      name: 'Adapter priority test',
      initialPrompt: 'Build',
      sessionCount: 1,
    });

    const reportingAdapter: HarnessAdapter = {
      name: 'reporting-adapter',
      buildCommand: () => ['mock'],
      parseOutput: (result: ExecResult) => ({
        agentOutput: result.stdout,
        filesModified: ['adapter/declared.ts'],
        transcript: result.stdout,
      }),
      seedToolPermissions: async () => {},
    };

    const executor = createMockExecutor();
    const store = createMockStore();
    const result = await runABComparison({ scenario, adapter: reportingAdapter, executor, store });

    expect(result.jumboResult.sessionRecords[0].filesModified).toEqual(['adapter/declared.ts']);
  });

  it('records the effective prompt and lifecycle audit only for Jumbo runs with an active goal', async () => {
    const scenario = createTestScenario({
      id: 'scenario-record',
      name: 'Test',
      initialPrompt: 'Build a hello world',
      sessionCount: 1,
      jumboPlan: {
        goals: [{
          title: 'Foundations',
          objective: 'Set up the project',
          criteria: ['scaffold exists'],
          sessionAvailableFrom: 1,
        }],
      },
    });

    const executor = createMockExecutor({ goalAddIds: ['gid-record'] });
    const adapter = createMockAdapter();
    const store = createMockStore();

    const result = await runABComparison({ scenario, adapter, executor, store });

    const jumboRecord = result.jumboResult.sessionRecords[0];
    const baselineRecord = result.baselineResult.sessionRecords[0];

    expect(jumboRecord.variant).toBe('jumbo');
    expect(jumboRecord.scenarioPrompt).toBe('Build a hello world');
    expect(jumboRecord.deliveredContext).toBeUndefined();
    expect(jumboRecord.effectivePrompt).toContain('Active goal for this session: gid-record');
    expect(jumboRecord.effectivePrompt).toContain('Build a hello world');
    expect(jumboRecord.jumboLifecycleAudit).toBeDefined();
    expect(jumboRecord.jumboLifecycleAudit?.activeGoalId).toBe('gid-record');

    expect(baselineRecord.variant).toBe('baseline');
    expect(baselineRecord.scenarioPrompt).toBe('Build a hello world');
    expect(baselineRecord.deliveredContext).toBeUndefined();
    expect(baselineRecord.effectivePrompt).toBe('Build a hello world');
    expect(baselineRecord.jumboLifecycleAudit).toBeUndefined();
  });

  it('keeps adapter commands prompt-free so the byte-identical scenario prompt is delivered via stdin', () => {
    const scenario = createTestScenario({
      id: 'scenario-1',
      name: 'Test',
      initialPrompt: 'Build a hello world',
      sessionCount: 1,
    });
    const scenarioPrompt = getSessionPrompt(scenario, 1);

    // No adapter embeds the prompt in argv any more; run-session.ts pipes
    // the prompt through LocalExecutor.exec's stdin option byte-for-byte.
    for (const adapter of [new ClaudeCodeAdapter(), new CodexCliAdapter(), new GeminiCliAdapter()]) {
      const command = adapter.buildCommand();
      expect(command).not.toContain(scenarioPrompt);
    }
  });

  it('composes the Jumbo lifecycle prompt with goal-id, protocol, and scenario task', () => {
    const scenarioPrompt = 'Build a hello world';
    const prompt = buildJumboLifecyclePrompt({
      scenarioPrompt,
      activeGoalId: 'goal-abc-123',
    });
    expect(prompt).toContain('Active goal for this session: goal-abc-123');
    expect(prompt).toContain('Jumbo lifecycle protocol');
    expect(prompt).toContain('jumbo session start');
    expect(prompt).toContain('jumbo goal start --id goal-abc-123');
    expect(prompt).toContain('jumbo goal submit --id goal-abc-123');
    expect(prompt).toContain('jumbo session end');
    expect(prompt).toContain('Scenario task for this session:');
    expect(prompt).toContain(scenarioPrompt);
    expect(prompt.indexOf('goal-abc-123')).toBeLessThan(prompt.indexOf('Scenario task for this session:'));
  });

  it('appends operator-injected context to the lifecycle prompt when present', () => {
    const prompt = buildJumboLifecyclePrompt({
      scenarioPrompt: 'do work',
      activeGoalId: 'g',
      injectedContext: 'remember edge case Q',
    });
    expect(prompt).toContain('[OPERATOR-INJECTED CONTEXT]:');
    expect(prompt).toContain('remember edge case Q');
  });

  it('produces a ComparisonResult with scores and deltas', async () => {
    const scenario = createTestScenario({
      id: 'scenario-1',
      name: 'Test',
      initialPrompt: 'Build something',
      sessionCount: 1,
      expectedFiles: ['src/index.ts', 'src/utils.ts'],
    });

    const executor = createMockExecutor();
    const adapter = createMockAdapter();
    const store = createMockStore();

    const result = await runABComparison({ scenario, adapter, executor, store });

    expect(result.scenarioId).toBe('scenario-1');
    expect(result.jumboResult.sessionRecords).toHaveLength(1);
    expect(result.baselineResult.sessionRecords).toHaveLength(1);
    expect(result.jumboScores).toHaveLength(6);
    expect(result.baselineScores).toHaveLength(6);
    expect(result.deltas).toHaveLength(6);
    expect(result.jumboScores[0].dimension).toBe('file-accuracy');
    expect(result.jumboScores[1].dimension).toBe('knowledge-retention');
    expect(result.jumboScores[2].dimension).toBe('disruption-recovery');
    expect(result.jumboScores[3].dimension).toBe('jumbo-memory-capture');
    expect(result.jumboScores[4].dimension).toBe('protocol-adherence');
    expect(result.jumboScores[5].dimension).toBe('token-efficiency');
  });

  it('captures Jumbo project memory after each session with JSON list commands', async () => {
    const scenario = createTestScenario({
      id: 'scenario-memory',
      name: 'Memory capture test',
      initialPrompt: 'Adopt Commander for the CLI and remember the decision.',
      sessionCount: 1,
      expectedJumboMemoryCaptures: [
        { kind: 'decision', match: 'Commander for CLI' },
        { kind: 'component', match: 'TaskStore' },
      ],
    });

    const executor = createMockExecutor({
      jumboMemoryOutputs: {
        decisions: [{ decisionId: 'dec-1', title: 'Commander for CLI', rationale: 'Matches local conventions.' }],
        components: [{ componentId: 'cmp-1', name: 'TaskStore', description: 'Persists tasks.' }],
      },
    });
    const adapter = createMockAdapter();
    const store = createMockStore();

    const result = await runABComparison({ scenario, adapter, executor, store });

    const memoryCommands = executor.execCalls.filter((call) =>
      call.command[0] === 'jumbo' && call.command[3] === '--format' && call.command[4] === 'json',
    );
    // The agent-driven lifecycle now records a pre-harness memory snapshot
    // (all six kinds) before the agent runs, a post-harness snapshot (all
    // six kinds again) after, and the lifecycle audit's decisionsListAfter
    // probe. Both snapshots must enumerate decisions/guidelines/invariants/
    // components/relations/dependencies in that order so the scorer can
    // diff post against pre.
    const memorySixKinds = [
      ['jumbo', 'decisions'],
      ['jumbo', 'guidelines'],
      ['jumbo', 'invariants'],
      ['jumbo', 'components'],
      ['jumbo', 'relations'],
      ['jumbo', 'dependencies'],
    ];
    const firstSix = memoryCommands.slice(0, 6).map((call) => call.command.slice(0, 2));
    expect(firstSix).toEqual(memorySixKinds);
    // The post-snapshot (the six commands immediately after the harness
    // exec) and the audit's trailing decisions list must also appear.
    const postSnapshotStart = memoryCommands.findIndex((c, idx) =>
      idx >= 6 && c.command[1] === 'decisions',
    );
    expect(postSnapshotStart).toBeGreaterThanOrEqual(6);
    expect(
      memoryCommands.slice(postSnapshotStart, postSnapshotStart + 6).map((c) => c.command.slice(0, 2)),
    ).toEqual(memorySixKinds);

    // Snapshot diff: pre was empty, post has the configured entities.
    const snapshotBefore = result.jumboResult.sessionRecords[0].jumboMemorySnapshotBefore;
    const snapshotAfter = result.jumboResult.sessionRecords[0].jumboMemorySnapshot;
    expect(snapshotBefore?.entities).toHaveLength(0);
    expect(snapshotAfter?.entities).toHaveLength(2);

    expect(result.jumboScores.find((score) => score.dimension === 'jumbo-memory-capture')?.score).toBe(1);
    expect(result.baselineScores.find((score) => score.dimension === 'jumbo-memory-capture')?.maxScore).toBe(0);
  });

  it('runs N sessions per working directory for multi-session scenarios', async () => {
    const scenario = createTestScenario({
      id: 'scenario-multi',
      name: 'Multi-session test',
      initialPrompt: 'Build a project',
      continuationPrompt: 'Continue the project',
      sessionCount: 3,
      expectedFiles: ['src/index.ts', 'src/utils.ts'],
      retentionPatterns: ['index.ts'],
    });

    const executor = createMockExecutor();
    const adapter = createMockAdapter();
    const store = createMockStore();

    const result = await runABComparison({ scenario, adapter, executor, store });

    expect(result.jumboResult.sessionRecords).toHaveLength(3);
    expect(result.baselineResult.sessionRecords).toHaveLength(3);
    expect(result.jumboResult.sessionRecords.map((r) => r.sessionNumber)).toEqual([1, 2, 3]);
    expect(result.baselineResult.sessionRecords.map((r) => r.sessionNumber)).toEqual([1, 2, 3]);
  });

  it('uses continuation prompt for sessions 2+', async () => {
    const scenario = createTestScenario({
      id: 'scenario-1',
      name: 'Test',
      initialPrompt: 'Initial task',
      continuationPrompt: 'Continue the work',
      sessionCount: 2,
    });

    const executor = createMockExecutor();
    const adapter = createMockAdapter();
    const store = createMockStore();

    await runABComparison({ scenario, adapter, executor, store });

    const harnessExecs = executor.execCalls.filter((c) => c.command[0] === 'mock');
    expect(harnessExecs).toHaveLength(4);
    expect(harnessExecs[0].stdin).toContain('Initial task');
    expect(harnessExecs[1].stdin).toContain('Continue the work');
    expect(harnessExecs[2].stdin).toBe('Initial task');
    expect(harnessExecs[3].stdin).toBe('Continue the work');
  });

  it('does not issue jumbo session start or end from the framework for jumbo runs', async () => {
    const scenario = createTestScenario({
      id: 'scenario-no-framework-lifecycle',
      name: 'Test',
      initialPrompt: 'Build',
      sessionCount: 2,
    });

    const executor = createMockExecutor();
    const adapter = createMockAdapter();
    const store = createMockStore();

    await runABComparison({ scenario, adapter, executor, store });

    const jumboSessionStarts = executor.execCalls.filter((c) =>
      c.command[0] === 'jumbo' && c.command[1] === 'session' && c.command[2] === 'start',
    );
    const jumboSessionEnds = executor.execCalls.filter((c) =>
      c.command[0] === 'jumbo' && c.command[1] === 'session' && c.command[2] === 'end',
    );

    expect(jumboSessionStarts).toHaveLength(0);
    expect(jumboSessionEnds).toHaveLength(0);
  });

  it('runs the post-session lifecycle audit and records it on the SessionRecord', async () => {
    const scenario = createTestScenario({
      id: 'scenario-audit',
      name: 'Audit',
      initialPrompt: 'Build',
      sessionCount: 1,
      jumboPlan: {
        goals: [{
          title: 'G',
          objective: 'O',
          criteria: ['c'],
          sessionAvailableFrom: 1,
        }],
      },
    });

    const executor = createMockExecutor({
      goalAddIds: ['gid-audit'],
      goalShowStatusBefore: 'refined',
      goalShowStatusAfter: 'submitted',
      goalVersionBefore: 1,
      goalVersionAfter: 4, // start (+1) + 1 progress (+1) + submit (+1) = +3
      sessionsTotalBefore: 0,
      sessionsTotalAfter: 1,
      sessionsEndedBefore: 0,
      sessionsEndedAfter: 1,
      jumboMemoryOutputs: {
        decisions: [{ decisionId: 'd1', title: 'New decision the agent registered' }],
      },
    });
    const adapter = createMockAdapter();
    const store = createMockStore();

    const result = await runABComparison({ scenario, adapter, executor, store });

    const audit = result.jumboResult.sessionRecords[0].jumboLifecycleAudit;
    expect(audit).toBeDefined();
    expect(audit?.activeGoalId).toBe('gid-audit');
    expect(audit?.sessionStartExecuted).toBe(true);
    expect(audit?.sessionEndExecuted).toBe(true);
    expect(audit?.goalStartExecuted).toBe(true);
    expect(audit?.goalSubmitExecuted).toBe(true);
    // New diff-derived signals:
    expect(audit?.inSessionCapturesExecuted).toBe(true);
    expect(audit?.progressUpdatesExecuted).toBe(true);
    expect(audit?.newEntityCount).toBe(1);
    expect(audit?.goalVersionBefore).toBe(1);
    expect(audit?.goalVersionAfter).toBe(4);
    expect(audit?.goalStatusBefore).toBe('refined');
    expect(audit?.goalStatusAfter).toBe('submitted');
    expect(audit?.sessionsTotalDelta).toBe(1);
    expect(audit?.sessionsEndedDelta).toBe(1);
    expect(audit?.evidence.goalShowBefore?.command).toEqual([
      'jumbo', 'goal', 'show', '--id', 'gid-audit', '--format', 'json',
    ]);
    expect(audit?.evidence.decisionsListAfter?.command).toEqual([
      'jumbo', 'decisions', 'list', '--format', 'json',
    ]);
  });

  it('scores protocol adherence across the six prescribed lifecycle steps', async () => {
    const scenario = createTestScenario({
      id: 'scenario-protocol',
      name: 'Protocol',
      initialPrompt: 'Build',
      sessionCount: 1,
      jumboPlan: {
        goals: [{
          title: 'G',
          objective: 'O',
          criteria: ['c'],
          sessionAvailableFrom: 1,
        }],
      },
    });

    const executor = createMockExecutor({
      goalAddIds: ['gid-protocol'],
      goalShowStatusBefore: 'refined',
      goalShowStatusAfter: 'submitted',
      goalVersionBefore: 1,
      goalVersionAfter: 4, // implies progress update executed
      sessionsTotalBefore: 0,
      sessionsTotalAfter: 1,
      sessionsEndedBefore: 0,
      sessionsEndedAfter: 1,
      jumboMemoryOutputs: {
        decisions: [{ decisionId: 'd1', title: 'A decision the agent captured' }],
      },
    });
    const adapter = createMockAdapter();
    const store = createMockStore();

    const result = await runABComparison({ scenario, adapter, executor, store });
    const protocolScore = result.jumboScores.find((s) => s.dimension === 'protocol-adherence');
    const baselineProtocolScore = result.baselineScores.find((s) => s.dimension === 'protocol-adherence');

    expect(protocolScore?.score).toBe(1);
    expect(protocolScore?.maxScore).toBe(1);
    expect(protocolScore?.details).toContain('steps-passed=6/6');
    expect(baselineProtocolScore?.maxScore).toBe(0);
    expect(baselineProtocolScore?.details).toContain('Not applicable');
  });

  it('surfaces protocol non-adherence (missing steps) as first-class signal, not noise', async () => {
    const scenario = createTestScenario({
      id: 'scenario-protocol-fail',
      name: 'Protocol fail',
      initialPrompt: 'Build',
      sessionCount: 1,
      jumboPlan: {
        goals: [{
          title: 'G',
          objective: 'O',
          criteria: ['c'],
          sessionAvailableFrom: 1,
        }],
      },
    });

    // Agent did not run goal submit and did not record any progress
    // updates. Status stays at 'doing'; version bumps only from goal start.
    const executor = createMockExecutor({
      goalAddIds: ['gid-partial'],
      goalShowStatusBefore: 'refined',
      goalShowStatusAfter: 'doing',
      goalVersionBefore: 1,
      goalVersionAfter: 2,
      sessionsTotalBefore: 0,
      sessionsTotalAfter: 1,
      sessionsEndedBefore: 0,
      sessionsEndedAfter: 0,
    });
    const adapter = createMockAdapter();
    const store = createMockStore();

    const result = await runABComparison({ scenario, adapter, executor, store });
    const audit = result.jumboResult.sessionRecords[0].jumboLifecycleAudit;
    expect(audit?.sessionStartExecuted).toBe(true);
    expect(audit?.goalStartExecuted).toBe(true);
    expect(audit?.goalSubmitExecuted).toBe(false);
    expect(audit?.sessionEndExecuted).toBe(false);
    expect(audit?.progressUpdatesExecuted).toBe(false);
    expect(audit?.inSessionCapturesExecuted).toBe(false);

    const protocolScore = result.jumboScores.find((s) => s.dimension === 'protocol-adherence');
    expect(protocolScore?.score).toBeLessThan(1);
    expect(protocolScore?.details).toContain('goal-submit-missed-in-sessions:1');
    expect(protocolScore?.details).toContain('session-end-missed-in-sessions:1');
    expect(protocolScore?.details).toContain('progress-updates-missed-in-sessions:1');
  });

  it('marks lifecycle steps as not executed when goal status stays refined and no sessions are created', async () => {
    const scenario = createTestScenario({
      id: 'scenario-not-executed',
      name: 'Not executed',
      initialPrompt: 'Build',
      sessionCount: 1,
      jumboPlan: {
        goals: [{
          title: 'G',
          objective: 'O',
          criteria: ['c'],
          sessionAvailableFrom: 1,
        }],
      },
    });

    const executor = createMockExecutor({
      goalAddIds: ['gid-skipped'],
      goalShowStatusBefore: 'refined',
      goalShowStatusAfter: 'refined',
      sessionsTotalBefore: 0,
      sessionsTotalAfter: 0,
      sessionsEndedBefore: 0,
      sessionsEndedAfter: 0,
    });
    const adapter = createMockAdapter();
    const store = createMockStore();

    const result = await runABComparison({ scenario, adapter, executor, store });
    const audit = result.jumboResult.sessionRecords[0].jumboLifecycleAudit;
    expect(audit?.sessionStartExecuted).toBe(false);
    expect(audit?.sessionEndExecuted).toBe(false);
    expect(audit?.goalStartExecuted).toBe(false);
    expect(audit?.goalSubmitExecuted).toBe(false);
    expect(audit?.inSessionCapturesExecuted).toBe(false);
    expect(audit?.progressUpdatesExecuted).toBe(false);
  });

  it('runs jumbo init in the jumbo working directory only', async () => {
    const scenario = createTestScenario({
      id: 'scenario-1',
      name: 'Test',
      initialPrompt: 'Build',
      sessionCount: 1,
    });

    const executor = createMockExecutor();
    const adapter = createMockAdapter();
    const store = createMockStore();

    await runABComparison({ scenario, adapter, executor, store });

    const jumboInits = executor.execCalls.filter((c) =>
      c.command[0] === 'jumbo' && c.command[1] === 'init',
    );
    expect(jumboInits).toHaveLength(1);
    expect(jumboInits[0].command).toEqual([
      'jumbo',
      'init',
      '--purpose',
      scenario.name,
      '--non-interactive',
      '--name',
      scenario.name,
      '--yolo',
    ]);

    // Baseline dir should not have jumbo init
    const baselineDir = executor.execCalls
      .filter((c) => c.command[0] === 'mock')
      .map((c) => c.workDir)
      .pop(); // Last mock call is baseline
    const baselineJumboInits = executor.execCalls.filter((c) =>
      c.workDir === baselineDir && c.command[0] === 'jumbo' && c.command[1] === 'init',
    );
    expect(baselineJumboInits).toHaveLength(0);
  });

  it('fails fast when jumbo init exits non-zero', async () => {
    const scenario = createTestScenario({
      id: 'scenario-1',
      name: 'Test',
      initialPrompt: 'Build',
      sessionCount: 1,
    });

    const executor = createMockExecutor({ failJumboInit: true });
    const adapter = createMockAdapter();
    const store = createMockStore();

    await expect(runABComparison({ scenario, adapter, executor, store })).rejects.toThrow(JumboInitError);

    // Setup probes (jumbo --version × 2) run before jumbo init; jumbo init is
    // the last call before the throw. No harness exec, no scoring.
    const initCall = executor.execCalls.find((c) => c.command[0] === 'jumbo' && c.command[1] === 'init');
    expect(initCall).toBeDefined();
    expect(executor.execCalls.filter((c) => c.command[0] === 'mock')).toHaveLength(0);
    expect(await store.listTestResults()).toHaveLength(0);
  });

  it('produces timeline with per-session scores for multi-session', async () => {
    const scenario = createTestScenario({
      id: 'scenario-1',
      name: 'Test',
      initialPrompt: 'Build',
      sessionCount: 3,
      expectedFiles: ['src/index.ts'],
      retentionPatterns: ['index.ts'],
    });

    const executor = createMockExecutor();
    const adapter = createMockAdapter();
    const store = createMockStore();

    const result = await runABComparison({ scenario, adapter, executor, store });

    expect(result.jumboTimeline).toHaveLength(3);
    expect(result.baselineTimeline).toHaveLength(3);
    expect(result.jumboTimeline![0].sessionNumber).toBe(1);
    expect(result.jumboTimeline![2].sessionNumber).toBe(3);
  });

  it('injects disruptions at scheduled sessions', async () => {
    const scenario = createTestScenario({
      id: 'scenario-disrupted',
      name: 'Disruption test',
      initialPrompt: 'Build a project',
      continuationPrompt: 'Continue',
      sessionCount: 3,
      disruptions: [{
        type: 'correction',
        sessionNumber: 2,
        content: 'Use snake_case not camelCase',
        recoveryPatterns: ['snake_case'],
      }],
    });

    const executor = createMockExecutor();
    const adapter = createMockAdapter();
    const store = createMockStore();

    await runABComparison({ scenario, adapter, executor, store });

    const harnessExecs = executor.execCalls.filter((c) => c.command[0] === 'mock');
    expect(harnessExecs).toHaveLength(6);

    // Jumbo session 2 (index 1) and baseline session 2 (index 4) should contain disruption
    expect(harnessExecs[1].stdin).toContain('[CORRECTION]');
    expect(harnessExecs[1].stdin).toContain('Use snake_case not camelCase');
    expect(harnessExecs[4].stdin).toContain('[CORRECTION]');

    // Session 1 should NOT contain disruption
    expect(harnessExecs[0].stdin).not.toContain('[CORRECTION]');
  });

  it('seeds adapter tool permissions in both arm workdirs before any session work', async () => {
    const scenario = createTestScenario({
      id: 'scenario-seed',
      name: 'Seed test',
      initialPrompt: 'Build',
      sessionCount: 1,
    });

    const executor = createMockExecutor();
    const adapter = createMockAdapter();
    const store = createMockStore();

    await runABComparison({ scenario, adapter, executor, store });

    expect(adapter.seededDirs).toHaveLength(2);
    expect(adapter.seededDirs).toEqual(expect.arrayContaining([
      expect.stringContaining('jumbo-eval-jumbo-'),
      expect.stringContaining('jumbo-eval-baseline-'),
    ]));
  });

  it('runs reachability probes in both arms before jumbo init: jumbo must reach jumbo, baseline must not', async () => {
    const scenario = createTestScenario({
      id: 'scenario-probe',
      name: 'Probe test',
      initialPrompt: 'Build',
      sessionCount: 1,
    });

    const executor = createMockExecutor();
    const adapter = createMockAdapter();
    const store = createMockStore();

    await runABComparison({ scenario, adapter, executor, store });

    const versionCalls = executor.execCalls.filter(
      (c) => c.command[0] === 'jumbo' && c.command[1] === '--version',
    );
    const jumboProbe = versionCalls.find((c) => c.workDir.includes('jumbo-eval-jumbo-'));
    const baselineProbe = versionCalls.find((c) => c.workDir.includes('jumbo-eval-baseline-'));
    expect(jumboProbe).toBeDefined();
    expect(baselineProbe).toBeDefined();
    // The jumbo probe runs without a baseline-shim env; the baseline probe
    // must run with the shim PATH so the real binary is shadowed.
    expect(jumboProbe?.env?.PATH).toBeUndefined();
    expect(baselineProbe?.env?.PATH).toContain('.eval-bin');

    // Both probes precede jumbo init
    const initIndex = executor.execCalls.findIndex(
      (c) => c.command[0] === 'jumbo' && c.command[1] === 'init',
    );
    const lastProbeIndex = Math.max(...versionCalls.map((c) =>
      executor.execCalls.indexOf(c),
    ));
    expect(lastProbeIndex).toBeLessThan(initIndex);
  });

  it('installs the fail-loud jumbo shim in the baseline workdir before any session work', async () => {
    const scenario = createTestScenario({
      id: 'scenario-shim',
      name: 'Shim test',
      initialPrompt: 'Build',
      sessionCount: 1,
    });
    const executor = createMockExecutor();
    const adapter = createMockAdapter();
    const store = createMockStore();

    await runABComparison({ scenario, adapter, executor, store });

    expect(executor.shimInstalledFor).toHaveLength(1);
    expect(executor.shimInstalledFor[0]).toContain('jumbo-eval-baseline-');
  });

  it('threads the baseline shim env into every baseline subprocess (probe + harness)', async () => {
    const scenario = createTestScenario({
      id: 'scenario-thread',
      name: 'Thread test',
      initialPrompt: 'Build',
      sessionCount: 2,
    });
    const executor = createMockExecutor();
    const adapter = createMockAdapter();
    const store = createMockStore();

    await runABComparison({ scenario, adapter, executor, store });

    const baselineCalls = executor.execCalls.filter((c) =>
      c.workDir.includes('jumbo-eval-baseline-'),
    );
    expect(baselineCalls.length).toBeGreaterThan(0);
    for (const c of baselineCalls) {
      expect(c.env?.PATH).toContain('.eval-bin');
    }
    // The jumbo arm must never carry the baseline shim env.
    const jumboCalls = executor.execCalls.filter((c) =>
      c.workDir.includes('jumbo-eval-jumbo-'),
    );
    for (const c of jumboCalls) {
      expect(c.env?.PATH ?? '').not.toContain('.eval-bin');
    }
  });

  it('throws JumboBaselineLeakError when the shim fails to shadow the real jumbo in baseline', async () => {
    const scenario = createTestScenario({
      id: 'scenario-leak',
      name: 'Leak test',
      initialPrompt: 'Build',
      sessionCount: 1,
    });
    const executor = createMockExecutor({ baselineJumboLeak: true });
    const adapter = createMockAdapter();
    const store = createMockStore();

    await expect(runABComparison({ scenario, adapter, executor, store })).rejects.toThrow(JumboBaselineLeakError);
    // No harness exec, no scoring after a leak failure.
    expect(executor.execCalls.filter((c) => c.command[0] === 'mock')).toHaveLength(0);
    expect(await store.listTestResults()).toHaveLength(0);
  });

  it('throws JumboReachabilityError when jumbo --version fails in jumbo arm and never runs harness', async () => {
    const scenario = createTestScenario({
      id: 'scenario-unreachable',
      name: 'Unreachable test',
      initialPrompt: 'Build',
      sessionCount: 1,
    });

    const executor = createMockExecutor({ failJumboVersion: 'jumbo' });
    const adapter = createMockAdapter();
    const store = createMockStore();

    await expect(runABComparison({ scenario, adapter, executor, store })).rejects.toThrow(JumboReachabilityError);

    // Failure must surface before any session work
    expect(executor.execCalls.filter((c) => c.command[0] === 'mock')).toHaveLength(0);
    expect(executor.execCalls.find((c) => c.command[0] === 'jumbo' && c.command[1] === 'init')).toBeUndefined();
    expect(await store.listTestResults()).toHaveLength(0);
  });

  it('enforces parity: scenario prompt is byte-equal across arms and the Jumbo arm prompt is a strict superset', async () => {
    const scenario = createTestScenario({
      id: 'scenario-parity',
      name: 'Parity test',
      initialPrompt: 'Build a hello world CLI',
      sessionCount: 2,
      continuationPrompt: 'Continue the work',
      jumboPlan: {
        goals: [
          { title: 'A', objective: 'a', criteria: ['c'], sessionAvailableFrom: 1 },
          { title: 'B', objective: 'b', criteria: ['c'], sessionAvailableFrom: 2 },
        ],
      },
    });
    const executor = createMockExecutor({ goalAddIds: ['gid-1', 'gid-2'] });
    const adapter = createMockAdapter();
    const store = createMockStore();

    const result = await runABComparison({ scenario, adapter, executor, store });

    for (let i = 0; i < scenario.sessionCount; i++) {
      const jumboRecord = result.jumboResult.sessionRecords[i];
      const baselineRecord = result.baselineResult.sessionRecords[i];

      // (a) Scenario prompt is byte-identical between arms.
      expect(jumboRecord.scenarioPrompt).toBe(baselineRecord.scenarioPrompt);

      // (b) The Jumbo collaboration block exists in exactly one arm.
      const jumboPrompt = jumboRecord.effectivePrompt ?? '';
      const baselinePrompt = baselineRecord.effectivePrompt ?? '';
      expect(baselinePrompt).toBe(baselineRecord.scenarioPrompt);
      expect(baselinePrompt).not.toContain('Jumbo lifecycle protocol');
      expect(jumboPrompt).toContain('Jumbo lifecycle protocol');

      // Strict superset: the baseline prompt appears verbatim inside the
      // Jumbo prompt, and the Jumbo prompt is strictly longer.
      expect(jumboPrompt.includes(baselinePrompt)).toBe(true);
      expect(jumboPrompt.length).toBeGreaterThan(baselinePrompt.length);
    }
  });

  describe('jumboPlan', () => {
    it('runs scenarios without a jumboPlan with no pre-seed or goal-add calls (default plan parity)', async () => {
      const scenario = createTestScenario({
        id: 'scenario-no-plan',
        name: 'No plan',
        initialPrompt: 'Build',
        sessionCount: 2,
      });
      const executor = createMockExecutor();
      const adapter = createMockAdapter();
      const store = createMockStore();

      await runABComparison({ scenario, adapter, executor, store });

      const addCalls = executor.execCalls.filter(
        (c) => c.command[0] === 'jumbo' && c.command[2] === 'add',
      );
      expect(addCalls).toHaveLength(0);
    });

    it('seeds preSeededMemory in the jumbo arm after init and before the first harness exec', async () => {
      const scenario = createTestScenario({
        id: 'scenario-seeded',
        name: 'Seeded plan',
        initialPrompt: 'Build',
        sessionCount: 1,
        jumboPlan: {
          preSeededMemory: [
            {
              kind: 'invariant',
              title: 'No mocks in integration tests',
              description: 'Integration tests must hit a real database.',
              rationale: 'Prior incident.',
            },
            {
              kind: 'component',
              name: 'TaskStore',
              type: 'storage',
              description: 'Persists tasks to disk.',
              responsibility: 'Durable task persistence.',
              path: 'src/storage/task-store.ts',
            },
            {
              kind: 'decision',
              title: 'Use Commander',
              context: 'Need a CLI parser',
              rationale: 'Matches conventions',
              alternatives: ['yargs'],
            },
            {
              kind: 'dependency',
              name: 'Express',
              ecosystem: 'npm',
              packageName: 'express',
              versionConstraint: '^4.18.0',
            },
            {
              kind: 'relation',
              fromType: 'component',
              fromId: 'TaskStore',
              toType: 'dependency',
              toId: 'express',
              type: 'uses',
              description: 'TaskStore depends on Express',
              strength: 'medium',
            },
          ],
          goals: [
            {
              title: 'Build CLI',
              objective: 'Ship a CLI',
              criteria: ['ships'],
              sessionAvailableFrom: 1,
            },
          ],
        },
      });
      const executor = createMockExecutor();
      const adapter = createMockAdapter();
      const store = createMockStore();

      await runABComparison({ scenario, adapter, executor, store });

      const jumboArm = executor.execCalls.filter((c) => c.workDir.includes('jumbo-eval-jumbo-'));
      const initIndex = jumboArm.findIndex(
        (c) => c.command[0] === 'jumbo' && c.command[1] === 'init',
      );
      const firstHarnessIndex = jumboArm.findIndex((c) => c.command[0] === 'mock');
      const seedKinds: string[] = [];
      for (let i = initIndex + 1; i < firstHarnessIndex; i++) {
        const call = jumboArm[i];
        if (call.command[0] === 'jumbo' && call.command[2] === 'add' &&
            ['decision', 'component', 'invariant', 'dependency', 'relation'].includes(call.command[1])) {
          seedKinds.push(call.command[1]);
        }
      }
      expect(seedKinds).toEqual(['invariant', 'component', 'decision', 'dependency', 'relation']);
    });

    it('does not seed preSeededMemory in the baseline arm', async () => {
      const scenario = createTestScenario({
        id: 'scenario-baseline-clean',
        name: 'Baseline clean',
        initialPrompt: 'Build',
        sessionCount: 1,
        jumboPlan: {
          preSeededMemory: [{
            kind: 'invariant',
            title: 'X',
            description: 'Y',
          }],
          goals: [{
            title: 'Foundation',
            objective: 'Build it',
            criteria: ['ships'],
            sessionAvailableFrom: 1,
          }],
        },
      });
      const executor = createMockExecutor();
      const adapter = createMockAdapter();
      const store = createMockStore();

      await runABComparison({ scenario, adapter, executor, store });

      const baselineAdds = executor.execCalls.filter(
        (c) => c.workDir.includes('jumbo-eval-baseline-') &&
               c.command[0] === 'jumbo' && c.command[2] === 'add',
      );
      expect(baselineAdds).toHaveLength(0);
    });

    it('fails fast when preSeededMemory registration exits non-zero', async () => {
      const scenario = createTestScenario({
        id: 'scenario-seed-fail',
        name: 'Seed fail',
        initialPrompt: 'Build',
        sessionCount: 1,
        jumboPlan: {
          preSeededMemory: [{
            kind: 'invariant',
            title: 'X',
            description: 'Y',
          }],
          goals: [{
            title: 'G',
            objective: 'O',
            criteria: ['c'],
            sessionAvailableFrom: 1,
          }],
        },
      });
      const executor = createMockExecutor({ failJumboPlanEntry: 'invariant' });
      const adapter = createMockAdapter();
      const store = createMockStore();

      await expect(runABComparison({ scenario, adapter, executor, store })).rejects.toThrow(JumboPlanSeedError);
      // No harness exec runs after a seed failure.
      expect(executor.execCalls.filter((c) => c.command[0] === 'mock')).toHaveLength(0);
    });

    it('registers plan goals only at their sessionAvailableFrom boundary (progressive release)', async () => {
      const scenario = createTestScenario({
        id: 'scenario-progressive',
        name: 'Progressive release',
        initialPrompt: 'Build',
        continuationPrompt: 'Continue',
        sessionCount: 3,
        jumboPlan: {
          goals: [
            {
              planRef: 'g1',
              title: 'Foundations',
              objective: 'Set up the project',
              criteria: ['scaffold exists'],
              sessionAvailableFrom: 1,
            },
            {
              planRef: 'g2',
              title: 'Add command',
              objective: 'Implement add',
              criteria: ['add works'],
              sessionAvailableFrom: 2,
              prerequisitePlanRefs: ['g1'],
            },
            {
              planRef: 'g3',
              title: 'Status transitions',
              objective: 'Implement transitions',
              criteria: ['transitions work'],
              sessionAvailableFrom: 3,
              prerequisitePlanRefs: ['g2'],
            },
          ],
        },
      });
      const executor = createMockExecutor({ goalAddIds: ['real-g1', 'real-g2', 'real-g3'] });
      const adapter = createMockAdapter();
      const store = createMockStore();

      await runABComparison({ scenario, adapter, executor, store });

      const jumboArm = executor.execCalls.filter((c) => c.workDir.includes('jumbo-eval-jumbo-'));
      const goalAdds = jumboArm.filter((c) =>
        c.command[0] === 'jumbo' && c.command[1] === 'goal' && c.command[2] === 'add',
      );
      expect(goalAdds).toHaveLength(3);

      // Each goal-add must precede its session's harness exec and follow
      // the previous session's harness exec (or init for #1).
      const harnessExecs = jumboArm
        .map((c, idx) => ({ c, idx }))
        .filter(({ c }) => c.command[0] === 'mock');
      expect(harnessExecs).toHaveLength(3);
      for (let i = 0; i < 3; i++) {
        const addIdx = jumboArm.indexOf(goalAdds[i]);
        expect(addIdx).toBeLessThan(harnessExecs[i].idx);
        if (i > 0) {
          expect(addIdx).toBeGreaterThan(harnessExecs[i - 1].idx);
        }
      }

      // Prerequisite plan refs resolve to the actual goal ids returned by the CLI.
      const g2Add = goalAdds[1];
      expect(g2Add.command).toContain('--prerequisite-goals');
      expect(g2Add.command[g2Add.command.indexOf('--prerequisite-goals') + 1]).toBe('real-g1');
      const g3Add = goalAdds[2];
      expect(g3Add.command[g3Add.command.indexOf('--prerequisite-goals') + 1]).toBe('real-g2');
    });

    it('threads the active goal-id into the jumbo prompt for each session but never the baseline', async () => {
      const scenario = createTestScenario({
        id: 'scenario-active-goal',
        name: 'Active goal',
        initialPrompt: 'Build',
        continuationPrompt: 'Continue',
        sessionCount: 2,
        jumboPlan: {
          goals: [
            {
              title: 'S1',
              objective: 'foundation',
              criteria: ['done'],
              sessionAvailableFrom: 1,
            },
            {
              title: 'S2',
              objective: 'next',
              criteria: ['done'],
              sessionAvailableFrom: 2,
            },
          ],
        },
      });
      const executor = createMockExecutor({ goalAddIds: ['gid-1', 'gid-2'] });
      const adapter = createMockAdapter();
      const store = createMockStore();

      const result = await runABComparison({ scenario, adapter, executor, store });

      expect(result.jumboResult.sessionRecords[0].effectivePrompt).toContain('gid-1');
      expect(result.jumboResult.sessionRecords[1].effectivePrompt).toContain('gid-2');
      expect(result.baselineResult.sessionRecords[0].effectivePrompt).not.toContain('gid-1');
      expect(result.baselineResult.sessionRecords[1].effectivePrompt).not.toContain('gid-2');
    });

    it('carries the previously active goal forward when no new goal is registered for a session', async () => {
      const scenario = createTestScenario({
        id: 'scenario-carry',
        name: 'Carry forward',
        initialPrompt: 'Build',
        continuationPrompt: 'Continue',
        sessionCount: 3,
        jumboPlan: {
          goals: [
            {
              title: 'Only goal',
              objective: 'one',
              criteria: ['done'],
              sessionAvailableFrom: 1,
            },
          ],
        },
      });
      const executor = createMockExecutor({ goalAddIds: ['only-goal-id'] });
      const adapter = createMockAdapter();
      const store = createMockStore();

      const result = await runABComparison({ scenario, adapter, executor, store });

      for (const record of result.jumboResult.sessionRecords) {
        expect(record.effectivePrompt).toContain('only-goal-id');
      }
    });

    it('throws JumboPlanGoalRegistrationError when goal add returns no parseable id', async () => {
      const scenario = createTestScenario({
        id: 'scenario-goal-noid',
        name: 'Goal no id',
        initialPrompt: 'Build',
        sessionCount: 1,
        jumboPlan: {
          goals: [{
            title: 'G',
            objective: 'O',
            criteria: ['c'],
            sessionAvailableFrom: 1,
          }],
        },
      });
      const baseExec = createMockExecutor();
      const noIdExecutor = {
        ...baseExec,
        exec: async (workDir: string, command: string[], execOptions?: { stdin?: string }) => {
          if (command[0] === 'jumbo' && command[1] === 'goal' && command[2] === 'add') {
            baseExec.execCalls.push({ workDir, command, stdin: execOptions?.stdin });
            return { stdout: 'no id here', stderr: '', exitCode: 0 };
          }
          return baseExec.exec(workDir, command, execOptions);
        },
      } as LocalExecutor;
      const adapter = createMockAdapter();
      const store = createMockStore();

      await expect(runABComparison({ scenario, adapter, executor: noIdExecutor, store }))
        .rejects.toThrow(JumboPlanGoalRegistrationError);
    });
  });

  describe('createTestScenario jumboPlan validation', () => {
    it('rejects sessionAvailableFrom outside 1..sessionCount', () => {
      expect(() => createTestScenario({
        id: 's',
        name: 's',
        initialPrompt: 'p',
        sessionCount: 2,
        jumboPlan: {
          goals: [{ title: 't', objective: 'o', criteria: ['c'], sessionAvailableFrom: 3 }],
        },
      })).toThrow('sessionAvailableFrom');

      expect(() => createTestScenario({
        id: 's',
        name: 's',
        initialPrompt: 'p',
        sessionCount: 2,
        jumboPlan: {
          goals: [{ title: 't', objective: 'o', criteria: ['c'], sessionAvailableFrom: 0 }],
        },
      })).toThrow('sessionAvailableFrom');
    });

    it('rejects an empty goals array', () => {
      expect(() => createTestScenario({
        id: 's',
        name: 's',
        initialPrompt: 'p',
        sessionCount: 1,
        jumboPlan: { goals: [] },
      })).toThrow('at least one goal');
    });
  });

  it('rejects if jumbo result is missing (invariant: both scores required)', () => {
    const { createComparisonResult } = require('../../src/domain/types');
    expect(() =>
      createComparisonResult({
        id: 'id',
        scenarioId: 's1',
        harness: 'h',
        jumboResult: null,
        baselineResult: { id: 'r', scenarioId: 's1', harness: 'h', sessionRecords: [], createdAt: '' },
        jumboScores: [],
        baselineScores: [],
        deltas: [],
      }),
    ).toThrow('ComparisonResult requires a jumboResult');
  });
});
