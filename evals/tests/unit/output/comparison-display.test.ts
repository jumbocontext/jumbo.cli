import { describe, it, expect } from '@jest/globals';
import { formatComparisonOutput } from '../../../src/output/comparison-display.js';
import {
  createComparisonResult,
  createTestResult,
  createSessionRecord,
} from '../../../src/domain/types.js';
import type { DimensionScore, PerSessionScore } from '../../../src/domain/types.js';

function makeRecord(sessionNumber: number, suffix: string) {
  return createSessionRecord({
    id: `r-${suffix}-${sessionNumber}`,
    scenarioId: 's1',
    sessionNumber,
    harness: 'h',
    agentOutput: '',
    filesModified: [],
    transcript: '',
    startedAt: '',
    completedAt: '',
  });
}

describe('formatComparisonOutput — token efficiency rendering', () => {
  it('renders a single token-efficiency row with the comparative ratio, (ref) baseline, and raw totals', () => {
    const tokenEfficiency: DimensionScore = {
      dimension: 'token-efficiency',
      score: 0.87,
      maxScore: 1,
      details: 'jumbo: 1300 tokens (130 tpq); baseline: 10000 tokens (1000 tpq)',
    };

    const comparison = createComparisonResult({
      id: 'cmp',
      scenarioId: 's1',
      harness: 'h',
      jumboResult: createTestResult({
        id: 'jr',
        scenarioId: 's1',
        harness: 'h',
        sessionRecords: [makeRecord(1, 'j')],
      }),
      baselineResult: createTestResult({
        id: 'br',
        scenarioId: 's1',
        harness: 'h',
        sessionRecords: [makeRecord(1, 'b')],
      }),
      jumboScores: [tokenEfficiency],
      baselineScores: [tokenEfficiency],
      deltas: [{ dimension: 'token-efficiency', score: 0, maxScore: 1 }],
    });

    const output = formatComparisonOutput(comparison);

    expect(output).toContain('token-efficiency');
    expect(output).toContain('+0.87');
    expect(output).toContain('(ref)');
    expect(output).toContain('jumbo: 1300 tokens');
    expect(output).toContain('baseline: 10000 tokens');
    // No self-ratio rendering
    expect(output).not.toMatch(/0\.87\/1\.00\s+0\.87\/1\.00/);
  });

  it('renders negative comparative ratio without sign prefix', () => {
    const tokenEfficiency: DimensionScore = {
      dimension: 'token-efficiency',
      score: -0.42,
      maxScore: 1,
      details: 'jumbo: 5000 tokens (500 tpq); baseline: 3500 tokens (350 tpq)',
    };

    const comparison = createComparisonResult({
      id: 'cmp',
      scenarioId: 's1',
      harness: 'h',
      jumboResult: createTestResult({
        id: 'jr',
        scenarioId: 's1',
        harness: 'h',
        sessionRecords: [makeRecord(1, 'j')],
      }),
      baselineResult: createTestResult({
        id: 'br',
        scenarioId: 's1',
        harness: 'h',
        sessionRecords: [makeRecord(1, 'b')],
      }),
      jumboScores: [tokenEfficiency],
      baselineScores: [tokenEfficiency],
      deltas: [{ dimension: 'token-efficiency', score: 0, maxScore: 1 }],
    });

    const output = formatComparisonOutput(comparison);
    expect(output).toContain('-0.42');
  });

  it('renders token-usage timeline rows as raw totals, not score/maxScore', () => {
    const jumboRecords = [makeRecord(1, 'j'), makeRecord(2, 'j')];
    const baselineRecords = [makeRecord(1, 'b'), makeRecord(2, 'b')];

    const tokenEfficiency: DimensionScore = {
      dimension: 'token-efficiency',
      score: 0.5,
      maxScore: 1,
      details: 'jumbo: 100 tokens; baseline: 200 tokens',
    };

    const jumboTimeline: PerSessionScore[] = [
      {
        sessionNumber: 1,
        scores: [{ dimension: 'token-usage', score: 1200, maxScore: 1200, details: '' }],
      },
      {
        sessionNumber: 2,
        scores: [{ dimension: 'token-usage', score: 800, maxScore: 800, details: '' }],
      },
    ];
    const baselineTimeline: PerSessionScore[] = [
      {
        sessionNumber: 1,
        scores: [{ dimension: 'token-usage', score: 3000, maxScore: 3000, details: '' }],
      },
      {
        sessionNumber: 2,
        scores: [{ dimension: 'token-usage', score: 2500, maxScore: 2500, details: '' }],
      },
    ];

    const comparison = createComparisonResult({
      id: 'cmp',
      scenarioId: 's1',
      harness: 'h',
      jumboResult: createTestResult({
        id: 'jr',
        scenarioId: 's1',
        harness: 'h',
        sessionRecords: jumboRecords,
      }),
      baselineResult: createTestResult({
        id: 'br',
        scenarioId: 's1',
        harness: 'h',
        sessionRecords: baselineRecords,
      }),
      jumboScores: [tokenEfficiency],
      baselineScores: [tokenEfficiency],
      deltas: [{ dimension: 'token-efficiency', score: 0, maxScore: 1 }],
      jumboTimeline,
      baselineTimeline,
    });

    const output = formatComparisonOutput(comparison);

    expect(output).toContain('TIMELINE');
    expect(output).toContain('token-usage');
    // Raw totals appear
    expect(output).toMatch(/\b1200\b/);
    expect(output).toMatch(/\b3000\b/);
    // Signed raw difference
    expect(output).toContain('-1800');
    expect(output).toContain('-1700');
    // No bogus self-ratio rendering for token-usage rows
    expect(output).not.toContain('1200.00/1200.00');
    expect(output).not.toContain('3000.00/3000.00');
  });
});
