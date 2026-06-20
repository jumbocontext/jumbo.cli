/**
 * Aggregates K replicated A/B comparisons of the same scenario and harness into
 * per-dimension lift statistics (GOAL.md Outcome 5). Pure and deterministic —
 * no I/O, no clock dependence beyond the report timestamp.
 *
 * Lift is reported as mean ± sample standard deviation across replications, and
 * is only flagged as a signal when the absolute mean lift exceeds one SD. A
 * t-statistic is reported alongside so a caller can compare it to the K=5,
 * one-tailed α=0.05 critical value (t > 2.13, df=4).
 */
import type { ComparisonResult, DimensionScore } from '../domain/result.js';
import type { DimensionLiftStat, ReplicationReport, ReplicationSignificance } from '../domain/replication.js';

/** One-tailed α=0.05 critical t by degrees of freedom (df = n − 1). */
const T_CRITICAL_ONE_TAILED_05: Readonly<Record<number, number>> = {
  1: 6.314,
  2: 2.920,
  3: 2.353,
  4: 2.132,
  5: 2.015,
  6: 1.943,
  7: 1.895,
  8: 1.860,
  9: 1.833,
  10: 1.812,
  15: 1.753,
  20: 1.725,
  30: 1.697,
};

function mean(xs: readonly number[]): number {
  return xs.length === 0 ? 0 : xs.reduce((sum, x) => sum + x, 0) / xs.length;
}

function sampleStdDev(xs: readonly number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  const variance = xs.reduce((sum, x) => sum + (x - m) ** 2, 0) / (xs.length - 1);
  return Math.sqrt(variance);
}

function scoreByDimension(scores: readonly DimensionScore[]): Map<string, DimensionScore> {
  const map = new Map<string, DimensionScore>();
  for (const score of scores) map.set(score.dimension, score);
  return map;
}

/** Dimensions present in the jumboScores of every replication, in first-replication order. */
function dimensionsInEveryReplication(comparisons: readonly ComparisonResult[]): string[] {
  if (comparisons.length === 0) return [];
  const [first, ...rest] = comparisons;
  let common = new Set(first.jumboScores.map((s) => s.dimension));
  for (const comparison of rest) {
    const here = new Set(comparison.jumboScores.map((s) => s.dimension));
    common = new Set([...common].filter((d) => here.has(d)));
  }
  return first.jumboScores.map((s) => s.dimension).filter((d) => common.has(d));
}

export function aggregateReplications(comparisons: readonly ComparisonResult[]): ReplicationReport {
  const k = comparisons.length;
  const createdAt = new Date().toISOString();
  const significance: ReplicationSignificance = {
    rule: 'isSignal = |meanLift| > sdLift',
    tCriticalOneTailed05: T_CRITICAL_ONE_TAILED_05[k - 1] ?? null,
    note: `Lift is a signal only when |meanLift| exceeds one SD. For K=5 (df=4) the one-tailed alpha=0.05 t-threshold is 2.13; current K=${k} (df=${Math.max(k - 1, 0)}).`,
  };

  if (k === 0) {
    return { scenarioId: '', harness: '', k: 0, dimensions: [], significance, createdAt };
  }

  const jumboMaps = comparisons.map((c) => scoreByDimension(c.jumboScores));
  const baselineMaps = comparisons.map((c) => scoreByDimension(c.baselineScores));

  const dimensions: DimensionLiftStat[] = dimensionsInEveryReplication(comparisons).map((dimension) => {
    const jumboVals: number[] = [];
    const baselineVals: number[] = [];
    const lifts: number[] = [];
    for (let i = 0; i < k; i++) {
      const jumbo = jumboMaps[i].get(dimension);
      const baseline = baselineMaps[i].get(dimension);
      if (!jumbo || !baseline) continue;
      // N/A markers (e.g. token-efficiency without output-equivalence) carry
      // maxScore 0 and are excluded from this dimension's statistics.
      if (jumbo.maxScore === 0) continue;
      jumboVals.push(jumbo.score);
      baselineVals.push(baseline.score);
      lifts.push(jumbo.score - baseline.score);
    }

    const applicable = lifts.length;
    const meanLift = mean(lifts);
    const sdLift = sampleStdDev(lifts);
    const tStatistic = sdLift > 0 && applicable >= 2 ? meanLift / (sdLift / Math.sqrt(applicable)) : 0;
    const isSignal = applicable >= 2 && Math.abs(meanLift) > sdLift;

    return {
      dimension,
      k,
      applicableReplications: applicable,
      meanJumbo: mean(jumboVals),
      meanBaseline: mean(baselineVals),
      meanLift,
      sdLift,
      tStatistic,
      isSignal,
    };
  });

  return {
    scenarioId: comparisons[0].scenarioId,
    harness: comparisons[0].harness,
    k,
    dimensions,
    significance,
    createdAt,
  };
}
