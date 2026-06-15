import { describe, it, expect, afterEach } from '@jest/globals';
import { mkdir, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { runABComparison } from '../../src/ab-runner.js';
import { HarnessExecutionError } from '../../src/run-session.js';
import { LocalExecutor } from '../../src/infrastructure/local-executor.js';
import type { ExecResult } from '../../src/infrastructure/container-manager.js';
import { createTestScenario } from '../../src/domain/types.js';
import type { ResultStore } from '../../src/storage/result-store.js';
import type { HarnessAdapter } from '../../src/harness/harness-adapter.js';
import type { SessionRecord, TestResult, TestScenario, ComparisonResult } from '../../src/domain/types.js';
import { generateFullReport } from '../../src/output/report-generator.js';

/**
 * Deterministic end-to-end validation.
 *
 * These tests prove the eval harness measures Jumbo context effects rather
 * than prompt drift, filesystem leakage, scorer artifacts, or partial-run
 * persistence. They use a fake harness whose behavior depends entirely on
 * the delivered Jumbo context, and a fake executor that simulates the
 * jumbo CLI deterministically while using real temp directories so that
 * workspace isolation is exercised — not mocked.
 */

const PRIOR_SESSION_FACT = 'snake_case';
const FACT_FOLLOWUP = `Use ${PRIOR_SESSION_FACT} for all identifiers.`;

interface FakeOptions {
  /** When true, the simulated agent does not consult or update Jumbo memory (control). */
  readonly emptyJumboMemory?: boolean;
  /** When set, the harness command exits with this code on session N. */
  readonly failHarnessOnSession?: { variant: 'jumbo' | 'baseline'; sessionNumber: number };
}

/**
 * Executor that uses real fs for temp dirs and snapshots, but simulates
 * the jumbo CLI and the harness CLI deterministically. Each variant gets
 * its own work dir; each work dir gets its own simulated jumbo memory.
 */
class FakeJumboExecutor extends LocalExecutor {
  private readonly memoryByDir = new Map<string, string[]>();
  private readonly sessionByDir = new Map<string, number>();
  private readonly sessionsByDir = new Map<string, { id: string; ended: boolean }[]>();
  private readonly goalSubmittedByDir = new Map<string, boolean>();
  readonly execCalls: Array<{ workDir: string; command: string[] }> = [];

  constructor(private readonly options: FakeOptions = {}) {
    super();
  }

  async exec(
    workDir: string,
    command: string[],
    options?: { stdin?: string; env?: Record<string, string | undefined> },
  ): Promise<ExecResult> {
    this.execCalls.push({ workDir, command });

    if (command[0] === 'jumbo') {
      return this.handleJumbo(workDir, command, options?.env);
    }

    if (command[0] === 'fake-harness') {
      return this.handleHarness(workDir, options?.stdin ?? '');
    }

    return { stdout: '', stderr: `unknown command: ${command[0]}`, exitCode: 1 };
  }

  private async handleJumbo(
    workDir: string,
    command: string[],
    env?: Record<string, string | undefined>,
  ): Promise<ExecResult> {
    if (command[1] === '--version') {
      // Baseline arm runs with a shimmed PATH; simulate the fail-loud shim.
      if (env?.PATH?.includes('.eval-bin')) {
        return {
          stdout: '',
          stderr: 'ERROR: jumbo is not available in the baseline arm (eval shim)',
          exitCode: 127,
        };
      }
      return { stdout: 'jumbo 1.2.3', stderr: '', exitCode: 0 };
    }

    if (command[1] === 'init') {
      this.memoryByDir.set(workDir, []);
      return { stdout: 'jumbo initialized', stderr: '', exitCode: 0 };
    }

    if (command[1] === 'goal' && command[2] === 'add') {
      const titleIdx = command.indexOf('--title');
      const title = titleIdx >= 0 ? command[titleIdx + 1] : 'goal';
      const goalId = `goal-${title.replace(/\s+/g, '-').toLowerCase()}`;
      return { stdout: JSON.stringify({ goalId }), stderr: '', exitCode: 0 };
    }

    if (command[1] === 'goal' && command[2] === 'show') {
      // The agent simulation in handleHarness toggles goalSubmittedByDir
      // to 'submitted' after running its protocol; the framework's
      // post-session audit reads that state through goal show.
      const status = this.goalSubmittedByDir.get(workDir) ? 'submitted' : 'refined';
      const idIdx = command.indexOf('--id');
      const id = idIdx >= 0 ? command[idIdx + 1] : undefined;
      return { stdout: JSON.stringify({ goal: { goalId: id, status } }), stderr: '', exitCode: 0 };
    }

    if (command[1] === 'sessions' && command[2] === 'list') {
      const statusIdx = command.indexOf('--status');
      const filter = statusIdx >= 0 ? command[statusIdx + 1] : 'all';
      const sessions = this.sessionsByDir.get(workDir) ?? [];
      const filtered = filter === 'ended'
        ? sessions.filter((s) => s.ended)
        : sessions;
      return {
        stdout: JSON.stringify(filtered.map((s) => ({ sessionId: s.id, ended: s.ended }))),
        stderr: '',
        exitCode: 0,
      };
    }

    // jumbo decisions/guidelines/.../relations list --format json
    if (command[2] === 'list' && command[3] === '--format' && command[4] === 'json') {
      const memory = this.memoryByDir.get(workDir) ?? [];
      const items = command[1] === 'decisions'
        ? memory.map((text, i) => ({ decisionId: `dec-${i}`, title: text }))
        : [];
      return { stdout: JSON.stringify(items), stderr: '', exitCode: 0 };
    }

    return { stdout: '', stderr: `unsupported jumbo command: ${command.join(' ')}`, exitCode: 1 };
  }

  private async handleHarness(workDir: string, prompt: string): Promise<ExecResult> {
    const isJumboDir = (this.memoryByDir.get(workDir) ?? null) !== null;
    const variant: 'jumbo' | 'baseline' = isJumboDir ? 'jumbo' : 'baseline';
    const session = (this.sessionByDir.get(workDir) ?? 0) + 1;
    this.sessionByDir.set(workDir, session);

    const fail = this.options.failHarnessOnSession;
    if (fail && fail.variant === variant && fail.sessionNumber === session) {
      return { stdout: '', stderr: 'simulated harness failure', exitCode: 1 };
    }

    // Simulate a protocol-compliant agent on the Jumbo arm: when the prompt
    // includes the lifecycle protocol, the agent runs `jumbo session start`,
    // pulls prior memory, and runs `jumbo session end` recording observed
    // facts. This makes the fake harness exercise the agent-driven lifecycle
    // rather than relying on the framework to inject memory into the prompt.
    const followsProtocol = isJumboDir
      && !this.options.emptyJumboMemory
      && prompt.includes('Jumbo lifecycle protocol');

    let effectivePrompt = prompt;
    if (followsProtocol) {
      const memory = this.memoryByDir.get(workDir) ?? [];
      const priorContext = memory.length === 0
        ? 'No prior project memory.'
        : `Prior project memory:\n${memory.join('\n')}`;
      effectivePrompt = `${priorContext}\n\n${prompt}`;
      // Record an active session for this work cycle so the post-session
      // audit can observe sessionStartExecuted via jumbo sessions list.
      const sessions = this.sessionsByDir.get(workDir) ?? [];
      sessions.push({ id: `s-${session}`, ended: false });
      this.sessionsByDir.set(workDir, sessions);
    }

    const factPresent = effectivePrompt.includes(PRIOR_SESSION_FACT);
    const filename = 'src/module.ts';
    const fileContent = factPresent
      ? `// Honors prior decision: ${PRIOR_SESSION_FACT} naming.\nexport const item_count = 0;\n`
      : `// No prior context; using default naming.\nexport const itemCount = 0;\n`;

    const fullPath = path.join(workDir, filename);
    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, fileContent, 'utf-8');

    if (followsProtocol) {
      // Agent runs `jumbo session end` recording the observed fact, and
      // `jumbo goal submit` marking the goal complete.
      if (factPresent || effectivePrompt.includes(PRIOR_SESSION_FACT)) {
        const memory = this.memoryByDir.get(workDir) ?? [];
        memory.push(`Decision: ${FACT_FOLLOWUP}`);
        this.memoryByDir.set(workDir, memory);
      }
      const sessions = this.sessionsByDir.get(workDir) ?? [];
      const last = sessions[sessions.length - 1];
      if (last) last.ended = true;
      this.goalSubmittedByDir.set(workDir, true);
    }

    const json = JSON.stringify({
      result: factPresent
        ? `Implemented module honoring ${PRIOR_SESSION_FACT} naming.`
        : 'Implemented module with default naming.',
      files_modified: [filename],
    });
    return { stdout: json, stderr: '', exitCode: 0 };
  }
}

function createFakeAdapter(): HarnessAdapter {
  return {
    name: 'fake-harness',
    buildCommand: () => ['fake-harness'],
    parseOutput: (result: ExecResult) => {
      try {
        const parsed = JSON.parse(result.stdout) as { result?: string; files_modified?: string[] };
        return {
          agentOutput: parsed.result ?? result.stdout,
          filesModified: parsed.files_modified ?? [],
          transcript: result.stdout,
          inputTokens: 100,
          outputTokens: 50,
        };
      } catch {
        return { agentOutput: result.stdout, filesModified: [], transcript: result.stdout };
      }
    },
    seedToolPermissions: async () => {},
  };
}

function createInMemoryStore(): ResultStore & {
  readonly records: SessionRecord[];
  readonly results: TestResult[];
} {
  const records: SessionRecord[] = [];
  const results: TestResult[] = [];
  return {
    records,
    results,
    saveScenario: async () => {},
    getScenario: async () => null,
    listScenarios: async () => [],
    saveSessionRecord: async (r) => { records.push(r); },
    getSessionRecords: async (scenarioId: string) => records.filter((r) => r.scenarioId === scenarioId),
    saveTestResult: async (r) => { results.push(r); },
    getTestResult: async () => null,
    listTestResults: async () => results,
  };
}

function createScenario(overrides?: Partial<TestScenario>): TestScenario {
  return createTestScenario({
    id: 'e2e-scenario',
    name: 'E2E deterministic validation',
    initialPrompt: `Begin the project. Adopt ${PRIOR_SESSION_FACT} for naming and remember the decision.`,
    continuationPrompt: 'Continue the project, honoring any prior decisions.',
    sessionCount: 2,
    expectedFiles: ['src/module.ts'],
    retentionPatterns: [PRIOR_SESSION_FACT],
    jumboPlan: {
      goals: [
        {
          title: 'Establish naming convention',
          objective: 'Implement the module using the agreed naming convention',
          criteria: ['module file exists'],
          sessionAvailableFrom: 1,
        },
      ],
    },
    ...overrides,
  });
}

describe('Deterministic end-to-end validation', () => {
  const created: ComparisonResult[] = [];

  afterEach(() => {
    created.length = 0;
  });

  it('produces a positive Jumbo lift only when the prior-session fact is delivered', async () => {
    const scenario = createScenario();
    const executor = new FakeJumboExecutor();
    const adapter = createFakeAdapter();
    const store = createInMemoryStore();

    const result = await runABComparison({ scenario, adapter, executor, store });
    created.push(result);

    // Session 1 of Jumbo's agent simulation runs the protocol, captures the
    // fact via its (simulated) session end, and the audit verifies it. The
    // agent in session 2 then reads the prior memory through `jumbo session
    // start` and writes snake_case files — so retention rises in session 2.
    const jumboSession2 = result.jumboResult.sessionRecords.find((r) => r.sessionNumber === 2)!;
    expect(jumboSession2.jumboLifecycleAudit?.sessionStartExecuted).toBe(true);
    expect(jumboSession2.jumboLifecycleAudit?.sessionEndExecuted).toBe(true);

    const baselineSession2 = result.baselineResult.sessionRecords.find((r) => r.sessionNumber === 2)!;
    expect(baselineSession2.deliveredContext).toBeUndefined();
    expect(baselineSession2.jumboLifecycleAudit).toBeUndefined();

    const retentionDelta = result.deltas.find((d) => d.dimension === 'knowledge-retention');
    expect(retentionDelta).toBeDefined();
    expect(retentionDelta!.score).toBeGreaterThan(0);

    // The retention pattern only appears in the file content when the fact
    // was injected into the prompt. The Jumbo final session's file content
    // honors snake_case naming; the baseline final session's does not.
    const jumboFinalFile = result.jumboResult.sessionRecords.at(-1)!
      .workspaceSnapshot!.files.find((f) => f.path === 'src/module.ts')!;
    const baselineFinalFile = result.baselineResult.sessionRecords.at(-1)!
      .workspaceSnapshot!.files.find((f) => f.path === 'src/module.ts')!;
    expect(jumboFinalFile.content).toContain(PRIOR_SESSION_FACT);
    expect(baselineFinalFile.content).not.toContain(PRIOR_SESSION_FACT);
  });

  it('produces zero lift when the Jumbo context carries no prior-session fact', async () => {
    const scenario = createScenario();
    const executor = new FakeJumboExecutor({ emptyJumboMemory: true });
    const adapter = createFakeAdapter();
    const store = createInMemoryStore();

    const result = await runABComparison({ scenario, adapter, executor, store });
    created.push(result);

    // Same fake harness, but Jumbo session-start delivers no fact. The Jumbo
    // variant cannot outperform baseline on retention or file-accuracy because
    // the harness behavior depends only on the delivered fact.
    const retentionDelta = result.deltas.find((d) => d.dimension === 'knowledge-retention');
    const fileDelta = result.deltas.find((d) => d.dimension === 'file-accuracy');
    expect(retentionDelta!.score).toBe(0);
    expect(fileDelta!.score).toBe(0);
  });

  it('isolates variants in separate temp workdirs with no cross-variant filesystem leakage', async () => {
    const scenario = createScenario();
    const executor = new FakeJumboExecutor();
    const adapter = createFakeAdapter();
    const store = createInMemoryStore();

    const result = await runABComparison({ scenario, adapter, executor, store });
    created.push(result);

    const workDirs = new Set(executor.execCalls.map((c) => c.workDir));
    expect(workDirs.size).toBe(2);

    const jumboFinal = result.jumboResult.sessionRecords.at(-1)!;
    const baselineFinal = result.baselineResult.sessionRecords.at(-1)!;

    // No cross-variant leakage: the file content reflecting the prior-session
    // fact only exists in the Jumbo dir. The baseline file content uses the
    // default naming because the fact was never delivered to it.
    const jumboFile = jumboFinal.workspaceSnapshot!.files
      .find((f) => f.path === 'src/module.ts')!;
    const baselineFile = baselineFinal.workspaceSnapshot!.files
      .find((f) => f.path === 'src/module.ts')!;
    expect(jumboFile.content).toContain(PRIOR_SESSION_FACT);
    expect(baselineFile.content).not.toContain(PRIOR_SESSION_FACT);
    expect(baselineFile.content).toContain('itemCount');
  });

  it('invalidates the comparison when the baseline harness fails (no partial result persisted)', async () => {
    const scenario = createScenario({ sessionCount: 1 });
    const executor = new FakeJumboExecutor({
      failHarnessOnSession: { variant: 'baseline', sessionNumber: 1 },
    });
    const adapter = createFakeAdapter();
    const store = createInMemoryStore();

    await expect(
      runABComparison({ scenario, adapter, executor, store }),
    ).rejects.toThrow(HarnessExecutionError);

    // Invariant: a partial result (only one variant) must not be persisted
    // and must not be aggregated into a ComparisonResult.
    expect(store.results).toHaveLength(0);
  });

  it('emits audit trails that explain measured deltas via context, snapshot, and scoring evidence', async () => {
    const scenario = createScenario();
    const executor = new FakeJumboExecutor();
    const adapter = createFakeAdapter();
    const store = createInMemoryStore();

    const result = await runABComparison({ scenario, adapter, executor, store });

    const report = generateFullReport([result], scenario.disruptions ?? []);
    expect(report.auditTrails).toHaveLength(1);

    const trail = report.auditTrails[0];

    // Effective context audit: the Jumbo final session's effective prompt
    // carries the lifecycle protocol and active goal-id (the prompt-prefix
    // injection path is gone; prior memory is delivered to the agent via
    // its own `jumbo session start` call, not via framework wrapping).
    const jumboLast = trail.jumboContext.at(-1)!;
    expect(jumboLast.effectivePrompt).toContain('Jumbo lifecycle protocol');

    // Final snapshot evidence: the module file content reflecting the fact
    // is captured for the Jumbo side; the baseline content is not.
    const jumboFile = trail.jumboFinalSnapshot!.files.find((f) => f.path === 'src/module.ts')!;
    const baselineFile = trail.baselineFinalSnapshot!.files.find((f) => f.path === 'src/module.ts')!;
    expect(jumboFile.content).toContain(PRIOR_SESSION_FACT);
    expect(baselineFile.content).not.toContain(PRIOR_SESSION_FACT);

    // Scoring evidence: each dimension's details and computed delta are present.
    const retentionEvidence = trail.scoringEvidence.find((e) => e.dimension === 'knowledge-retention');
    expect(retentionEvidence).toBeDefined();
    expect(retentionEvidence!.delta).toBeGreaterThan(0);
    expect(retentionEvidence!.jumboDetails).toBeDefined();
    expect(retentionEvidence!.baselineDetails).toBeDefined();
  });

});
