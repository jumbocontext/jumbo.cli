import { randomUUID } from 'node:crypto';
import { Command } from 'commander';
import type { ComparisonResult, EvalRunRecord, TestScenario } from '../../domain/types.js';
import type { ResultStore } from '../../storage/result-store.js';
import type { HarnessAdapter } from '../../harness/harness-adapter.js';
import { runABComparison } from '../../ab-runner.js';
import { LocalExecutor } from '../../infrastructure/local-executor.js';
import type { HeartbeatWriter } from '../../infrastructure/heartbeat-writer.js';
import { ClaudeCodeAdapter, CodexCliAdapter, GeminiCliAdapter } from '../../harness/index.js';
import { formatComparisonOutput } from '../../output/comparison-display.js';
import { formatCrossHarnessComparison } from '../../output/cross-harness-display.js';
import { generateFullReport, formatFullReport } from '../../output/report-generator.js';
import { formatReplicationReport } from '../../output/replication-display.js';
import { aggregateReplications } from '../../analysis/replication-stats.js';

const VALID_HARNESSES = ['claude-code', 'codex-cli', 'gemini-cli'] as const;
type HarnessName = typeof VALID_HARNESSES[number];

export type ABRunner = typeof runABComparison;
export type HeartbeatWriterProvider = (params: {
  readonly store: ResultStore;
  readonly runId: string;
  readonly scenarioId: string;
  readonly harnesses: readonly string[];
  readonly sessionCount: number;
}) => Promise<(HeartbeatWriter & { initialize?: () => Promise<void> }) | undefined>;

export interface RunDeps {
  readonly storeProvider: () => Promise<ResultStore>;
  readonly abRunner?: ABRunner;
  readonly heartbeatWriterProvider?: HeartbeatWriterProvider;
  readonly executorProvider?: () => LocalExecutor;
  readonly adapterProvider?: (name: string) => HarnessAdapter;
}

function buildAdapter(name: HarnessName): HarnessAdapter {
  switch (name) {
    case 'claude-code':
      return new ClaudeCodeAdapter();
    case 'codex-cli':
      return new CodexCliAdapter();
    case 'gemini-cli':
      return new GeminiCliAdapter();
  }
}

/**
 * Registers the 'run' command.
 * Executes a scenario against specified harnesses, producing A/B comparison runs.
 */
export function registerRunCommand(program: Command, deps: RunDeps): void {
  program
    .command('run')
    .description('Execute a scenario against specified harnesses')
    .requiredOption('--scenario <id>', 'Scenario ID to run')
    .option('--harness <harnesses...>', 'Harness(es) to run against', ['claude-code'])
    .option('--sessions <count>', 'Override scenario session count', parseInt)
    .option('--replicate <count>', 'Run K replications per arm and report lift as mean +/- SD (Outcome 5)', (v) => parseInt(v, 10), 1)
    .addHelpText('after', `
Examples:
  eval run --scenario abc123
  eval run --scenario abc123 --harness claude-code codex-cli
  eval run --scenario abc123 --harness gemini-cli --sessions 5
  eval run --scenario abc123 --replicate 5
    `)
    .action(async (opts: { scenario: string; harness: string[]; sessions?: number; replicate: number }) => {
      const harnesses = validateHarnesses(opts.harness) as HarnessName[];

      const replicate = opts.replicate ?? 1;
      if (!Number.isInteger(replicate) || replicate < 1) {
        throw new Error(`--replicate must be an integer >= 1 (got ${String(opts.replicate)})`);
      }
      if (replicate > 1 && replicate < 5) {
        console.warn(`[WARNING] --replicate ${replicate}: K>=5 is the minimum for a credible signal (GOAL.md); below K=5, lift cannot be reliably distinguished from noise.`);
      }

      const store = await deps.storeProvider();
      const scenario = await store.getScenario(opts.scenario);
      if (!scenario) {
        throw new Error(`Scenario not found: ${opts.scenario}`);
      }

      const sessionCount = opts.sessions ?? scenario.sessionCount;
      const effectiveScenario: TestScenario = sessionCount === scenario.sessionCount
        ? scenario
        : { ...scenario, sessionCount };

      const abRunner = deps.abRunner ?? runABComparison;
      const executor = deps.executorProvider?.() ?? new LocalExecutor();
      const runId = randomUUID();
      const startedAt = new Date().toISOString();
      const runRecord: EvalRunRecord = {
        runId,
        scenarioId: effectiveScenario.id,
        harnesses,
        sessionCount,
        startedAt,
        status: 'running',
      };
      const supportsRunState = hasRunStateMethods(store);
      if (supportsRunState) {
        await store.saveRunRecord(runRecord);
      }
      const heartbeatWriter = supportsRunState
        ? await deps.heartbeatWriterProvider?.({
            store,
            runId,
            scenarioId: effectiveScenario.id,
            harnesses,
            sessionCount,
          })
        : undefined;
      await heartbeatWriter?.initialize?.();
      console.log(`Run ID: ${runId}`);

      const comparisons: ComparisonResult[] = [];
      const replicationsByHarness: ComparisonResult[][] = [];
      try {
        for (const name of harnesses) {
          const adapter = deps.adapterProvider?.(name) ?? buildAdapter(name);
          const replications: ComparisonResult[] = [];
          for (let rep = 0; rep < replicate; rep++) {
            const comparison = await abRunner({
              scenario: effectiveScenario,
              adapter,
              executor,
              store,
              runId,
              heartbeatWriter,
            });
            replications.push(comparison);
            comparisons.push(comparison);
            console.log(formatComparisonOutput(comparison, scenario.disruptions));
          }
          replicationsByHarness.push(replications);
        }

        if (supportsRunState) {
          await store.saveRunRecord({
            ...runRecord,
            completedAt: new Date().toISOString(),
            status: 'completed',
          });
        }
      } catch (err: unknown) {
        if (supportsRunState) {
          await store.saveRunRecord({
            ...runRecord,
            completedAt: new Date().toISOString(),
            status: 'failed',
          });
        }
        throw err;
      }

      if (comparisons.length === 0) {
        console.log('No comparisons produced; skipping report.');
        return;
      }

      // Replication mode (K>1): the statistical artifact (per-dimension lift as
      // mean +/- SD with a one-SD significance flag) per harness is produced,
      // persisted by runId, and displayed. The single-run cross-harness/full-
      // report view below is left exactly as-is for K=1.
      if (replicate > 1) {
        const canPersistReplication = typeof (store as Partial<ResultStore>).saveReplicationReport === 'function';
        for (const replications of replicationsByHarness) {
          const replicationReport = aggregateReplications(replications);
          if (canPersistReplication) {
            await store.saveReplicationReport(runId, replicationReport);
          }
          console.log(formatReplicationReport(replicationReport));
        }
        return;
      }

      if (comparisons.length > 1) {
        console.log(formatCrossHarnessComparison(comparisons));
      }

      const tamperedExcluded = comparisons.filter((c) => c.tampered);
      const aggregateComparisons = comparisons.filter((c) => !c.tampered);

      if (aggregateComparisons.length === 0) {
        console.log(`No comparisons available for report: all ${tamperedExcluded.length} were marked tampered. Use 'eval report --scenario ${effectiveScenario.id} --include-tampered' to view.`);
        return;
      }

      const report = generateFullReport(
        aggregateComparisons,
        effectiveScenario.disruptions ?? [],
        tamperedExcluded,
      );
      console.log(formatFullReport(report));
      if (tamperedExcluded.length > 0) {
        console.log(`\n[NOTICE] ${tamperedExcluded.length} tampered comparison(s) excluded from aggregates. Use 'eval report --scenario ${effectiveScenario.id} --include-tampered' to include them.`);
      }
    });
}

function hasRunStateMethods(store: ResultStore): boolean {
  const candidate = store as Partial<ResultStore>;
  return typeof candidate.saveRunRecord === 'function'
    && typeof candidate.writeHeartbeat === 'function';
}

/**
 * Validates harness names against known adapters.
 * Returns validated names or throws with helpful error.
 */
export function validateHarnesses(harnesses: readonly string[]): string[] {
  const invalid = harnesses.filter((h) => !VALID_HARNESSES.includes(h as HarnessName));
  if (invalid.length > 0) {
    throw new Error(
      `Unknown harness(es): ${invalid.join(', ')}. Valid harnesses: ${VALID_HARNESSES.join(', ')}`,
    );
  }
  return [...harnesses];
}
