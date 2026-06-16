import { describe, it, expect } from '@jest/globals';
import {
  computeDivergenceCurve,
  computeLiftPercentages,
  detectDivergenceOnset,
  analyzeDisruptionImpact,
  aggregateHarnessLifts,
  generateFullReport,
  formatFullReport,
} from '../../src/output/report-generator.js';
import { createComparisonResult, createTestResult, createSessionRecord } from '../../src/domain/types.js';
import type { ComparisonResult, Disruption } from '../../src/domain/types.js';

function makeComparison(opts: {
  harness?: string;
  jumboScores?: Array<{ dimension: string; score: number }>;
  baselineScores?: Array<{ dimension: string; score: number }>;
  sessionCount?: number;
}): ComparisonResult {
  const harness = opts.harness ?? 'claude-code';
  const sessionCount = opts.sessionCount ?? 3;
  const jumboScoreValues = opts.jumboScores ?? [
    { dimension: 'file-accuracy', score: 0.9 },
    { dimension: 'knowledge-retention', score: 0.8 },
  ];
  const baselineScoreValues = opts.baselineScores ?? [
    { dimension: 'file-accuracy', score: 0.7 },
    { dimension: 'knowledge-retention', score: 0.4 },
  ];

  const records = Array.from({ length: sessionCount }, (_, i) =>
    createSessionRecord({
      id: `rec-${i}`,
      scenarioId: 'scenario-1',
      sessionNumber: i + 1,
      harness,
      agentOutput: 'output',
      filesModified: ['src/index.ts'],
      transcript: 'transcript',
      startedAt: '2026-03-21T10:00:00Z',
      completedAt: '2026-03-21T10:05:00Z',
    }),
  );

  const jumboResult = createTestResult({ id: 'jr', scenarioId: 'scenario-1', harness, sessionRecords: records });
  const baselineResult = createTestResult({ id: 'br', scenarioId: 'scenario-1', harness, sessionRecords: records });

  const jumboScores = jumboScoreValues.map((s) => ({ ...s, maxScore: 1 }));
  const baselineScores = baselineScoreValues.map((s) => ({ ...s, maxScore: 1 }));
  const deltas = jumboScores.map((js, i) => ({
    dimension: js.dimension,
    score: Math.round((js.score - baselineScores[i].score) * 1000) / 1000,
    maxScore: 1,
  }));

  // Build timelines with increasing divergence
  const jumboTimeline = records.map((r, i) => ({
    sessionNumber: r.sessionNumber,
    scores: jumboScoreValues.map((s) => ({
      dimension: s.dimension,
      score: Math.round((s.score - (sessionCount - 1 - i) * 0.05) * 100) / 100,
      maxScore: 1,
    })),
  }));

  const baselineTimeline = records.map((r, i) => ({
    sessionNumber: r.sessionNumber,
    scores: baselineScoreValues.map((s) => ({
      dimension: s.dimension,
      score: Math.round((s.score - i * 0.1) * 100) / 100,
      maxScore: 1,
    })),
  }));

  return createComparisonResult({
    id: `comp-${harness}`,
    scenarioId: 'scenario-1',
    harness,
    jumboResult,
    baselineResult,
    jumboScores,
    baselineScores,
    deltas,
    jumboTimeline,
    baselineTimeline,
  });
}

describe('computeDivergenceCurve', () => {
  it('returns per-session per-dimension deltas', () => {
    const comp = makeComparison({});
    const curve = computeDivergenceCurve(comp);

    expect(curve.length).toBeGreaterThan(0);
    expect(curve[0]).toHaveProperty('sessionNumber');
    expect(curve[0]).toHaveProperty('dimension');
    expect(curve[0]).toHaveProperty('delta');
  });

  it('returns empty for comparisons without timelines', () => {
    const comp: ComparisonResult = {
      ...makeComparison({}),
      jumboTimeline: undefined,
      baselineTimeline: undefined,
    };
    expect(computeDivergenceCurve(comp)).toEqual([]);
  });
});

describe('computeLiftPercentages', () => {
  it('computes absolute and percentage lift', () => {
    const comp = makeComparison({
      jumboScores: [{ dimension: 'file-accuracy', score: 0.9 }],
      baselineScores: [{ dimension: 'file-accuracy', score: 0.6 }],
    });

    const lifts = computeLiftPercentages(comp);

    expect(lifts).toHaveLength(1);
    expect(lifts[0].absoluteLift).toBeCloseTo(0.3, 2);
    expect(lifts[0].percentageLift).toBeCloseTo(50, 0);
  });

  it('returns null percentage when baseline is zero', () => {
    const comp = makeComparison({
      jumboScores: [{ dimension: 'test', score: 0.5 }],
      baselineScores: [{ dimension: 'test', score: 0 }],
    });

    const lifts = computeLiftPercentages(comp);
    expect(lifts[0].percentageLift).toBeNull();
  });
});

describe('detectDivergenceOnset', () => {
  it('detects onset when delta exceeds threshold', () => {
    const curve = [
      { sessionNumber: 1, dimension: 'retention', jumboScore: 0.8, baselineScore: 0.78, delta: 0.02 },
      { sessionNumber: 2, dimension: 'retention', jumboScore: 0.8, baselineScore: 0.7, delta: 0.1 },
      { sessionNumber: 3, dimension: 'retention', jumboScore: 0.8, baselineScore: 0.5, delta: 0.3 },
    ];

    const onsets = detectDivergenceOnset(curve, 0.1);
    expect(onsets).toHaveLength(1);
    expect(onsets[0].onsetSession).toBe(2);
    expect(onsets[0].deltaAtOnset).toBe(0.1);
  });

  it('returns null onset when no divergence exceeds threshold', () => {
    const curve = [
      { sessionNumber: 1, dimension: 'retention', jumboScore: 0.8, baselineScore: 0.79, delta: 0.01 },
      { sessionNumber: 2, dimension: 'retention', jumboScore: 0.8, baselineScore: 0.78, delta: 0.02 },
    ];

    const onsets = detectDivergenceOnset(curve, 0.1);
    expect(onsets[0].onsetSession).toBeNull();
  });
});

describe('analyzeDisruptionImpact', () => {
  it('ranks disruptions by impact magnitude', () => {
    const curve = [
      { sessionNumber: 1, dimension: 'retention', jumboScore: 0.8, baselineScore: 0.8, delta: 0 },
      { sessionNumber: 2, dimension: 'retention', jumboScore: 0.9, baselineScore: 0.5, delta: 0.4 },
      { sessionNumber: 3, dimension: 'retention', jumboScore: 0.85, baselineScore: 0.6, delta: 0.25 },
    ];

    const disruptions: Disruption[] = [
      { type: 'correction', sessionNumber: 2, content: 'Fix naming convention', recoveryPatterns: ['camelCase'] },
    ];

    const impacts = analyzeDisruptionImpact(curve, disruptions);
    expect(impacts.length).toBeGreaterThan(0);
    expect(impacts[0].impactMagnitude).toBeCloseTo(0.4, 2);
  });

  it('returns empty for no disruptions', () => {
    const curve = [
      { sessionNumber: 1, dimension: 'retention', jumboScore: 0.8, baselineScore: 0.8, delta: 0 },
    ];

    expect(analyzeDisruptionImpact(curve, [])).toEqual([]);
  });
});

describe('aggregateHarnessLifts', () => {
  it('computes average lift per harness', () => {
    const comp1 = makeComparison({
      harness: 'claude-code',
      jumboScores: [{ dimension: 'test', score: 0.9 }],
      baselineScores: [{ dimension: 'test', score: 0.6 }],
    });
    const comp2 = makeComparison({
      harness: 'codex-cli',
      jumboScores: [{ dimension: 'test', score: 0.8 }],
      baselineScores: [{ dimension: 'test', score: 0.4 }],
    });

    const agg = aggregateHarnessLifts([comp1, comp2]);

    expect(agg).toHaveLength(2);
    expect(agg[0].harness).toBe('claude-code');
    expect(agg[0].avgLift).toBeCloseTo(0.3, 2);
    expect(agg[1].harness).toBe('codex-cli');
    expect(agg[1].avgLift).toBeCloseTo(0.4, 2);
  });
});

describe('generateFullReport', () => {
  it('produces a complete report structure', () => {
    const comp = makeComparison({});
    const report = generateFullReport([comp]);

    expect(report.scenarioId).toBe('scenario-1');
    expect(report.harnesses).toEqual(['claude-code']);
    expect(report.divergenceCurve.length).toBeGreaterThan(0);
    expect(report.liftResults.length).toBeGreaterThan(0);
    expect(report.divergenceOnsets.length).toBeGreaterThan(0);
    expect(report.generatedAt).toBeTruthy();
  });
});

describe('formatFullReport', () => {
  it('produces readable terminal output', () => {
    const comp = makeComparison({});
    const report = generateFullReport([comp]);
    const output = formatFullReport(report);

    expect(output).toContain('JUMBO EVALUATION REPORT');
    expect(output).toContain('LIFT BY DIMENSION');
    expect(output).toContain('DIVERGENCE ONSET');
    expect(output).toContain('DIVERGENCE CURVE');
    expect(output).toContain('scenario-1');
  });

  it('includes cross-harness aggregation when multiple harnesses', () => {
    const comp1 = makeComparison({ harness: 'claude-code' });
    const comp2 = makeComparison({ harness: 'codex-cli' });
    const report = generateFullReport([comp1, comp2]);
    const output = formatFullReport(report);

    expect(output).toContain('CROSS-HARNESS AGGREGATION');
  });
});
