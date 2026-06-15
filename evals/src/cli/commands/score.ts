import { randomUUID } from 'node:crypto';
import { Command } from 'commander';
import type { TestResult, DimensionScore, TestScenario, ComparisonResult } from '../../domain/types.js';
import { createComparisonResult } from '../../domain/types.js';
import type { ResultStore } from '../../storage/result-store.js';
import { scoreFileAccuracy } from '../../scoring/file-accuracy-scorer.js';
import { scoreKnowledgeRetention } from '../../scoring/knowledge-retention-scorer.js';
import { scoreDisruptionRecovery } from '../../scoring/disruption-recovery-scorer.js';
import { baselineJumboMemoryCaptureScore, scoreJumboMemoryCapture } from '../../scoring/jumbo-memory-capture-scorer.js';
import { compareTokenEfficiency, scoreTokenEfficiency } from '../../scoring/token-efficiency-scorer.js';

export interface ScoreDeps {
  readonly storeProvider: () => Promise<ResultStore>;
}

interface ScoreCommandOptions {
  readonly scenario: string;
  readonly result?: string;
  readonly includeTampered?: boolean;
}

type ScoredTestResult = TestResult & {
  readonly scores: readonly DimensionScore[];
  readonly comparisonResult?: ComparisonResult;
};

/**
 * Registers the 'score' command.
 * Triggers the scoring engine against completed runs.
 */
export function registerScoreCommand(program: Command, deps: ScoreDeps): void {
  program
    .command('score')
    .description('Run the scoring engine against completed runs')
    .requiredOption('--scenario <id>', 'Scenario ID to score')
    .option('--result <id>', 'Specific test result ID to score')
    .option('--include-tampered', 'Include tampered SessionRecords in aggregate dimension scores (excluded by default)')
    .addHelpText('after', `
Examples:
  eval score --scenario abc123
  eval score --scenario abc123 --result result-456
  eval score --scenario abc123 --include-tampered
    `)
    .action(async (opts: ScoreCommandOptions) => {
      const store = await deps.storeProvider();
      const scenario = await store.getScenario(opts.scenario);
      if (!scenario) {
        throw new Error(`Scenario not found: ${opts.scenario}`);
      }

      const results = await loadResults(store, opts);
      if (results.length === 0) {
        throw new Error(`No completed test results found for scenario: ${opts.scenario}`);
      }

      const scored = results.map((result) => ({
        result,
        scores: scoreDeterministicDimensions(result, scenario, { includeTampered: opts.includeTampered ?? false }),
      }));

      for (const item of scored) {
        console.log(formatScoreOutput(item.result, item.scores));
      }

      const comparisons = computeComparisons(scored, { includeTampered: opts.includeTampered ?? false });
      const comparisonsByResultId = new Map<string, ComparisonResult>();
      for (const comparison of comparisons) {
        comparisonsByResultId.set(comparison.jumboResult.id, comparison);
        comparisonsByResultId.set(comparison.baselineResult.id, comparison);
      }

      for (const item of scored) {
        const scoredResult: ScoredTestResult = {
          ...item.result,
          scores: item.scores,
          comparisonResult: comparisonsByResultId.get(item.result.id),
        };
        await store.saveTestResult(scoredResult);
      }
    });
}

async function loadResults(
  store: ResultStore,
  opts: ScoreCommandOptions,
): Promise<TestResult[]> {
  const results = await store.listTestResults(opts.scenario);
  if (!opts.result) return results;

  const result = results.find((candidate) => candidate.id === opts.result);
  if (!result) {
    throw new Error(`Test result not found for scenario ${opts.scenario}: ${opts.result}`);
  }
  return [result];
}

function isBaselineResult(result: TestResult): boolean {
  return result.sessionRecords.some((record) => record.variant === 'baseline')
    && !result.sessionRecords.some((record) => record.variant === 'jumbo');
}

function isJumboResult(result: TestResult): boolean {
  return result.sessionRecords.some((record) => record.variant === 'jumbo');
}

function scoreDeterministicDimensions(
  result: TestResult,
  scenario: TestScenario,
  opts: { includeTampered: boolean },
): DimensionScore[] {
  const expectedFiles = scenario.expectedFiles ?? [];
  const retentionPatterns = scenario.retentionPatterns ?? [];
  const disruptions = scenario.disruptions ?? [];
  const expectedJumboMemoryCaptures = scenario.expectedJumboMemoryCaptures ?? [];
  const records = opts.includeTampered
    ? result.sessionRecords
    : result.sessionRecords.filter((r) => !r.tampered);

  const fileScore = scoreFileAccuracy(records, expectedFiles);
  const retentionScore = scoreKnowledgeRetention(records, retentionPatterns);
  const disruptionScore = scoreDisruptionRecovery(records, disruptions);
  const memoryScore = isBaselineResult(result)
    ? baselineJumboMemoryCaptureScore(expectedJumboMemoryCaptures)
    : scoreJumboMemoryCapture(records, expectedJumboMemoryCaptures);
  const averageQuality = (fileScore.score + retentionScore.score) / 2;
  const tokenScore = scoreTokenEfficiency(records, averageQuality);

  return [
    fileScore,
    retentionScore,
    disruptionScore,
    tokenScore,
    memoryScore,
  ];
}

function computeComparisons(
  scored: readonly { result: TestResult; scores: readonly DimensionScore[] }[],
  opts: { includeTampered: boolean },
): ComparisonResult[] {
  const comparisons: ComparisonResult[] = [];

  const byHarness = new Map<string, typeof scored>();
  for (const item of scored) {
    byHarness.set(item.result.harness, [...(byHarness.get(item.result.harness) ?? []), item]);
  }

  for (const items of byHarness.values()) {
    const jumbo = items.find((item) => isJumboResult(item.result));
    const baseline = items.find((item) => isBaselineResult(item.result));
    if (!jumbo || !baseline) continue;

    const jumboQuality = averageQualityScore(jumbo.scores);
    const baselineQuality = averageQualityScore(baseline.scores);
    const jumboTokenRecords = opts.includeTampered
      ? jumbo.result.sessionRecords
      : jumbo.result.sessionRecords.filter((r) => !r.tampered);
    const baselineTokenRecords = opts.includeTampered
      ? baseline.result.sessionRecords
      : baseline.result.sessionRecords.filter((r) => !r.tampered);
    const tokenDelta = compareTokenEfficiency(
      jumboTokenRecords,
      baselineTokenRecords,
      jumboQuality,
      baselineQuality,
    );
    const jumboScores = jumbo.scores.map((score) =>
      score.dimension === tokenDelta.dimension ? tokenDelta : score,
    );
    const baselineScores = baseline.scores.map((score) =>
      score.dimension === tokenDelta.dimension ? tokenDelta : score,
    );

    const deltas = jumboScores.map((jumboScore) => {
      const baselineScore = baselineScores.find((score) => score.dimension === jumboScore.dimension);
      return {
        dimension: jumboScore.dimension,
        score: Math.round((jumboScore.score - (baselineScore?.score ?? 0)) * 100) / 100,
        maxScore: jumboScore.maxScore,
        details: `jumbo=${jumboScore.score.toFixed(2)} baseline=${(baselineScore?.score ?? 0).toFixed(2)}`,
      };
    });

    comparisons.push(createComparisonResult({
      id: randomUUID(),
      scenarioId: jumbo.result.scenarioId,
      harness: jumbo.result.harness,
      jumboResult: jumbo.result,
      baselineResult: baseline.result,
      jumboScores,
      baselineScores,
      deltas,
    }));
  }

  return comparisons;
}

function averageQualityScore(scores: readonly DimensionScore[]): number {
  const qualityScores = scores.filter((score) =>
    score.dimension === 'file-accuracy' || score.dimension === 'knowledge-retention'
  );
  if (qualityScores.length === 0) return 0;
  return qualityScores.reduce((sum, score) => sum + score.score, 0) / qualityScores.length;
}

/**
 * Formats scoring output for terminal display.
 * Pure function — no I/O.
 */
export function formatScoreOutput(
  result: TestResult,
  scores: readonly DimensionScore[],
): string {
  const lines: string[] = [];
  const divider = '─'.repeat(50);

  lines.push(`  Scores for result: ${result.id}`);
  lines.push(`  Scenario: ${result.scenarioId}`);
  lines.push(`  Harness:  ${result.harness}`);
  lines.push(`  Sessions: ${result.sessionRecords.length}`);
  lines.push(divider);

  for (const score of scores) {
    const pct = score.maxScore === 0 ? 'N/A' : `${(score.score / score.maxScore * 100).toFixed(0)}%`;
    lines.push(`  ${padRight(score.dimension, 24)} ${score.score.toFixed(2)}/${score.maxScore.toFixed(2)} (${pct})`);
    if (score.details) {
      lines.push(`    ${score.details}`);
    }
  }

  return lines.join('\n');
}

function padRight(str: string, width: number): string {
  return str.length >= width ? str : str + ' '.repeat(width - str.length);
}
