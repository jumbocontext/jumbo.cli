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
    .addHelpText('after', `
Examples:
  eval run --scenario abc123
  eval run --scenario abc123 --harness claude-code codex-cli
  eval run --scenario abc123 --harness gemini-cli --sessions 5
    `)
    .action(async (opts: { scenario: string; harness: string[]; sessions?: number }) => {
      const harnesses = validateHarnesses(opts.harness) as HarnessName[];

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
      try {
        for (const name of harnesses) {
          const adapter = deps.adapterProvider?.(name) ?? buildAdapter(name);
          const comparison = await abRunner({
            scenario: effectiveScenario,
            adapter,
            executor,
            store,
            runId,
            heartbeatWriter,
          });
          comparisons.push(comparison);
          console.log(formatComparisonOutput(comparison, scenario.disruptions));
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

      if (comparisons.length > 1) {
        console.log(formatCrossHarnessComparison(comparisons));
      }

      if (comparisons.length === 0) {
        console.log('No comparisons produced; skipping report.');
        return;
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
