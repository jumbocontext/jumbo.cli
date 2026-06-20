import { describe, it, expect } from '@jest/globals';
import { aggregateReplications } from '../../src/analysis/replication-stats.js';
import type { ComparisonResult, DimensionScore } from '../../src/domain/index.js';

/** Builds a minimal ComparisonResult carrying only the per-dimension scores the aggregator reads. */
function comparison(
  dims: Record<string, { jumbo: number; baseline: number; maxScore?: number }>,
): ComparisonResult {
  const score = (dimension: string, value: number, maxScore: number): DimensionScore => ({
    dimension,
    score: value,
    maxScore,
    details: '',
  });
  const jumboScores = Object.entries(dims).map(([d, v]) => score(d, v.jumbo, v.maxScore ?? 1));
  const baselineScores = Object.entries(dims).map(([d, v]) => score(d, v.baseline, v.maxScore ?? 1));
  const deltas = Object.entries(dims).map(([d, v]) => score(d, v.jumbo - v.baseline, v.maxScore ?? 1));
  return {
    id: 'c',
    scenarioId: 'scenario-1',
    harness: 'claude-code',
    jumboResult: { id: 'j', scenarioId: 'scenario-1', harness: 'claude-code', sessionRecords: [], createdAt: 't', tampered: false, tamperLog: [] },
    baselineResult: { id: 'b', scenarioId: 'scenario-1', harness: 'claude-code', sessionRecords: [], createdAt: 't', tampered: false, tamperLog: [] },
    jumboScores,
    baselineScores,
    deltas,
    createdAt: 't',
    tampered: false,
    tamperLog: [],
  };
}

function dim(report: ReturnType<typeof aggregateReplications>, name: string) {
  const d = report.dimensions.find((x) => x.dimension === name);
  if (!d) throw new Error(`dimension ${name} not in report`);
  return d;
}

describe('aggregateReplications', () => {
  it('computes mean lift, sample (n-1) SD, and arm means across replications', () => {
    const report = aggregateReplications([
      comparison({ 'file-accuracy': { jumbo: 0.8, baseline: 0.6 } }),
      comparison({ 'file-accuracy': { jumbo: 0.9, baseline: 0.5 } }),
      comparison({ 'file-accuracy': { jumbo: 1.0, baseline: 0.4 } }),
    ]);
    expect(report.k).toBe(3);
    expect(report.scenarioId).toBe('scenario-1');
    expect(report.harness).toBe('claude-code');

    const fa = dim(report, 'file-accuracy');
    expect(fa.meanJumbo).toBeCloseTo(0.9, 6);
    expect(fa.meanBaseline).toBeCloseTo(0.5, 6);
    expect(fa.meanLift).toBeCloseTo(0.4, 6); // lifts [0.2, 0.4, 0.6]
    expect(fa.sdLift).toBeCloseTo(0.2, 6); // sample SD of [0.2,0.4,0.6]
    expect(fa.applicableReplications).toBe(3);
    expect(fa.tStatistic).toBeCloseTo(0.4 / (0.2 / Math.sqrt(3)), 4);
  });

  it('flags a signal only when |mean lift| exceeds one SD', () => {
    // lifts [0.3, 0.5] -> mean 0.4, sd 0.1414 -> signal
    const signal = aggregateReplications([
      comparison({ d: { jumbo: 0.3, baseline: 0 } }),
      comparison({ d: { jumbo: 0.5, baseline: 0 } }),
    ]);
    expect(dim(signal, 'd').isSignal).toBe(true);

    // lifts [0, 0.4] -> mean 0.2, sd 0.2828 -> not a signal
    const noise = aggregateReplications([
      comparison({ d: { jumbo: 0, baseline: 0 } }),
      comparison({ d: { jumbo: 0.4, baseline: 0 } }),
    ]);
    expect(dim(noise, 'd').isSignal).toBe(false);
  });

  it('treats K=1 as no SD and never a signal', () => {
    const report = aggregateReplications([comparison({ d: { jumbo: 1, baseline: 0 } })]);
    const d = dim(report, 'd');
    expect(report.k).toBe(1);
    expect(d.sdLift).toBe(0);
    expect(d.tStatistic).toBe(0);
    expect(d.isSignal).toBe(false);
    expect(d.applicableReplications).toBe(1);
  });

  it('excludes N/A (maxScore 0) token-efficiency replications and records the applicable count', () => {
    const report = aggregateReplications([
      comparison({ 'token-efficiency': { jumbo: 0.5, baseline: 0, maxScore: 1 } }),
      comparison({ 'token-efficiency': { jumbo: 0.3, baseline: 0, maxScore: 1 } }),
      comparison({ 'token-efficiency': { jumbo: 0, baseline: 0, maxScore: 0 } }), // N/A
    ]);
    const te = dim(report, 'token-efficiency');
    expect(te.k).toBe(3);
    expect(te.applicableReplications).toBe(2);
    expect(te.meanLift).toBeCloseTo(0.4, 6); // mean of [0.5, 0.3]
  });

  it('aggregates multiple dimensions independently', () => {
    const report = aggregateReplications([
      comparison({ a: { jumbo: 1, baseline: 0 }, b: { jumbo: 0.2, baseline: 0.2 } }),
      comparison({ a: { jumbo: 1, baseline: 0 }, b: { jumbo: 0.4, baseline: 0.4 } }),
    ]);
    expect(dim(report, 'a').meanLift).toBeCloseTo(1, 6);
    expect(dim(report, 'b').meanLift).toBeCloseTo(0, 6);
    expect(dim(report, 'a').isSignal).toBe(true); // lift 1, sd 0
    expect(dim(report, 'b').isSignal).toBe(false); // lift 0
  });

  it('only includes dimensions present in every replication', () => {
    const report = aggregateReplications([
      comparison({ a: { jumbo: 1, baseline: 0 }, b: { jumbo: 1, baseline: 0 } }),
      comparison({ a: { jumbo: 1, baseline: 0 } }), // no b
    ]);
    expect(report.dimensions.map((d) => d.dimension)).toEqual(['a']);
  });

  it('records the K=5 significance threshold note', () => {
    const report = aggregateReplications([
      comparison({ a: { jumbo: 1, baseline: 0 } }),
      comparison({ a: { jumbo: 1, baseline: 0 } }),
      comparison({ a: { jumbo: 1, baseline: 0 } }),
      comparison({ a: { jumbo: 1, baseline: 0 } }),
      comparison({ a: { jumbo: 1, baseline: 0 } }),
    ]);
    expect(report.significance.tCriticalOneTailed05).toBeCloseTo(2.132, 2); // df = 4
    expect(report.significance.note).toContain('2.13');
  });
});
