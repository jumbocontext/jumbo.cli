import { Command } from 'commander';
import type { ComparisonResult, TestResult } from '../../domain/types.js';
import type { ResultStore } from '../../storage/result-store.js';
import { formatCrossHarnessComparison } from '../../output/cross-harness-display.js';
import { exportReportAsJson } from '../../output/json-report.js';
import { formatFullReport, generateFullReport, type FullReport } from '../../output/report-generator.js';

const VALID_HARNESSES = ['claude-code', 'codex-cli', 'gemini-cli'] as const;
const VALID_DIMENSIONS = [
  'file-accuracy',
  'knowledge-retention',
  'disruption-recovery',
  'token-efficiency',
  'jumbo-memory-capture',
] as const;

export interface ReportDeps {
  readonly storeProvider: () => Promise<ResultStore>;
}

interface ReportCommandOptions {
  readonly scenario: string;
  readonly harness?: readonly string[];
  readonly dimension?: readonly string[];
  readonly json?: boolean;
  readonly includeTampered?: boolean;
}

type TestResultWithComparison = TestResult & {
  readonly comparisonResult?: ComparisonResult;
};

/**
 * Registers the 'report' command.
 * Generates lift reports with optional harness and dimension filters.
 */
export function registerReportCommand(program: Command, deps: ReportDeps): void {
  program
    .command('report')
    .description('Generate lift reports from completed comparison runs')
    .requiredOption('--scenario <id>', 'Scenario ID to report on')
    .option('--harness <harnesses...>', 'Filter by harness(es)')
    .option('--dimension <dimensions...>', 'Filter by dimension(s)')
    .option('--json', 'Output as JSON for external consumption')
    .option('--include-tampered', 'Include tampered ComparisonResults in cross-harness aggregates and lift summaries (excluded by default)')
    .addHelpText('after', `
Examples:
  eval report --scenario abc123
  eval report --scenario abc123 --harness claude-code
  eval report --scenario abc123 --dimension file-accuracy knowledge-retention
  eval report --scenario abc123 --json
  eval report --scenario abc123 --include-tampered
    `)
    .action(async (opts: ReportCommandOptions) => {
      const harnesses = validateReportHarnesses(opts.harness ?? []);
      const dimensions = validateReportDimensions(opts.dimension ?? []);
      const includeTampered = opts.includeTampered ?? false;

      const store = await deps.storeProvider();
      const scenario = await store.getScenario(opts.scenario);
      const allComparisons = filterComparisonsByHarness(
        extractComparisonResults(await store.listTestResults(opts.scenario)),
        harnesses,
      );

      if (allComparisons.length === 0) {
        console.log(`No comparisons found for scenario: ${opts.scenario}`);
        return;
      }

      const tamperedExcluded = includeTampered ? [] : allComparisons.filter((c) => c.tampered);
      const aggregateComparisons = includeTampered
        ? allComparisons
        : allComparisons.filter((c) => !c.tampered);

      const report = filterReportByDimensions(
        generateFullReport(aggregateComparisons, scenario?.disruptions ?? [], tamperedExcluded),
        dimensions,
      );

      if (opts.json) {
        console.log(exportReportAsJson(report));
        return;
      }

      console.log(formatTerminalReport(aggregateComparisons, report, dimensions));
      if (tamperedExcluded.length > 0) {
        console.log(`\n[NOTICE] ${tamperedExcluded.length} tampered comparison(s) excluded from aggregates. Use --include-tampered to include them.`);
        for (const c of tamperedExcluded) {
          console.log(`  - ${c.harness} (id=${c.id}): ${c.tamperLog.length} tamper event(s)`);
        }
      }
    });
}

export function validateReportHarnesses(harnesses: readonly string[]): string[] {
  const invalid = harnesses.filter((h) => !VALID_HARNESSES.includes(h as typeof VALID_HARNESSES[number]));
  if (invalid.length > 0) {
    throw new Error(
      `Unknown harness(es): ${invalid.join(', ')}. Valid harnesses: ${VALID_HARNESSES.join(', ')}`,
    );
  }
  return [...harnesses];
}

export function validateReportDimensions(dimensions: readonly string[]): string[] {
  const invalid = dimensions.filter((d) => !VALID_DIMENSIONS.includes(d as typeof VALID_DIMENSIONS[number]));
  if (invalid.length > 0) {
    throw new Error(
      `Unknown dimension(s): ${invalid.join(', ')}. Valid dimensions: ${VALID_DIMENSIONS.join(', ')}`,
    );
  }
  return [...dimensions];
}

export function extractComparisonResults(results: readonly TestResult[]): ComparisonResult[] {
  const byId = new Map<string, ComparisonResult>();
  for (const result of results as readonly TestResultWithComparison[]) {
    if (result.comparisonResult) {
      byId.set(result.comparisonResult.id, result.comparisonResult);
    }
  }
  return [...byId.values()];
}

function formatTerminalReport(
  comparisons: readonly ComparisonResult[],
  report: FullReport,
  dimensions: readonly string[],
): string {
  const displayComparisons = dimensions.length > 0
    ? comparisons.map((comparison) => filterComparisonByDimensions(comparison, dimensions))
    : comparisons;

  if (comparisons.length > 1) {
    return `${formatCrossHarnessComparison(displayComparisons)}\n\n${formatFullReport(report)}`;
  }
  return formatFullReport(report);
}

function filterComparisonByDimensions(
  comparison: ComparisonResult,
  dimensions: readonly string[],
): ComparisonResult {
  const dimSet = new Set(dimensions);
  return {
    ...comparison,
    jumboScores: comparison.jumboScores.filter((score) => dimSet.has(score.dimension)),
    baselineScores: comparison.baselineScores.filter((score) => dimSet.has(score.dimension)),
    deltas: comparison.deltas.filter((score) => dimSet.has(score.dimension)),
    jumboTimeline: comparison.jumboTimeline?.map((session) => ({
      ...session,
      scores: session.scores.filter((score) => dimSet.has(score.dimension)),
    })),
    baselineTimeline: comparison.baselineTimeline?.map((session) => ({
      ...session,
      scores: session.scores.filter((score) => dimSet.has(score.dimension)),
    })),
  };
}

/**
 * Filters a report's lift results by dimension names.
 * Pure function — no I/O.
 */
export function filterReportByDimensions(
  report: FullReport,
  dimensions: readonly string[],
): FullReport {
  if (dimensions.length === 0) return report;

  const dimSet = new Set(dimensions);

  return {
    ...report,
    liftResults: report.liftResults.filter((l) => dimSet.has(l.dimension)),
    divergenceCurve: report.divergenceCurve.filter((p) => dimSet.has(p.dimension)),
    divergenceOnsets: report.divergenceOnsets.filter((o) => dimSet.has(o.dimension)),
    disruptionImpacts: report.disruptionImpacts.filter((i) => dimSet.has(i.dimension)),
    memoryCaptureEvidence: dimSet.has('jumbo-memory-capture') ? report.memoryCaptureEvidence : [],
    harnessAggregation: report.harnessAggregation.map((h) => ({
      ...h,
      dimensionLifts: h.dimensionLifts.filter((l) => dimSet.has(l.dimension)),
    })),
    auditTrails: report.auditTrails.map((t) => ({
      ...t,
      scoringEvidence: t.scoringEvidence.filter((e) => dimSet.has(e.dimension)),
    })),
  };
}

/**
 * Filters comparisons by harness names.
 * Pure function — no I/O.
 */
export function filterComparisonsByHarness(
  comparisons: readonly ComparisonResult[],
  harnesses: readonly string[],
): ComparisonResult[] {
  if (harnesses.length === 0) return [...comparisons];
  const harnessSet = new Set(harnesses);
  return comparisons.filter((c) => harnessSet.has(c.harness));
}
