import { describe, it, expect } from '@jest/globals';
import { formatCrossHarnessComparison } from '../../src/output/cross-harness-display.js';
import { createComparisonResult, createTestResult, createSessionRecord } from '../../src/domain/types.js';
import type { ComparisonResult } from '../../src/domain/types.js';

function makeComparison(harness: string, jumboScoreValue: number, baselineScoreValue: number): ComparisonResult {
  const record = createSessionRecord({
    id: `rec-${harness}`,
    scenarioId: 'scenario-1',
    sessionNumber: 1,
    harness,
    agentOutput: 'output',
    filesModified: ['src/index.ts'],
    transcript: 'transcript',
    startedAt: '2026-03-21T10:00:00Z',
    completedAt: '2026-03-21T10:05:00Z',
  });

  const jumboResult = createTestResult({
    id: `jumbo-${harness}`,
    scenarioId: 'scenario-1',
    harness,
    sessionRecords: [record],
  });

  const baselineResult = createTestResult({
    id: `baseline-${harness}`,
    scenarioId: 'scenario-1',
    harness,
    sessionRecords: [record],
  });

  return createComparisonResult({
    id: `comp-${harness}`,
    scenarioId: 'scenario-1',
    harness,
    jumboResult,
    baselineResult,
    jumboScores: [
      { dimension: 'file-accuracy', score: jumboScoreValue, maxScore: 1 },
      { dimension: 'knowledge-retention', score: jumboScoreValue, maxScore: 1 },
    ],
    baselineScores: [
      { dimension: 'file-accuracy', score: baselineScoreValue, maxScore: 1 },
      { dimension: 'knowledge-retention', score: baselineScoreValue, maxScore: 1 },
    ],
    deltas: [
      { dimension: 'file-accuracy', score: Math.round((jumboScoreValue - baselineScoreValue) * 100) / 100, maxScore: 1 },
      { dimension: 'knowledge-retention', score: Math.round((jumboScoreValue - baselineScoreValue) * 100) / 100, maxScore: 1 },
    ],
  });
}

describe('formatCrossHarnessComparison', () => {
  it('returns message for empty comparisons', () => {
    const output = formatCrossHarnessComparison([]);
    expect(output).toContain('No comparison results');
  });

  it('returns message for single comparison', () => {
    const comp = makeComparison('claude-code', 0.9, 0.6);
    const output = formatCrossHarnessComparison([comp]);
    expect(output).toContain('at least 2 harnesses');
  });

  it('shows cross-harness comparison for two harnesses', () => {
    const claude = makeComparison('claude-code', 0.9, 0.6);
    const codex = makeComparison('codex-cli', 0.8, 0.5);

    const output = formatCrossHarnessComparison([claude, codex]);

    expect(output).toContain('Cross-Harness Comparison');
    expect(output).toContain('claude-code');
    expect(output).toContain('codex-cli');
    expect(output).toContain('scenario-1');
  });

  it('shows lift deltas per harness', () => {
    const claude = makeComparison('claude-code', 0.9, 0.6); // delta = +0.30
    const codex = makeComparison('codex-cli', 0.8, 0.5);   // delta = +0.30

    const output = formatCrossHarnessComparison([claude, codex]);

    expect(output).toContain('JUMBO LIFT BY HARNESS');
    expect(output).toContain('+0.30');
  });

  it('shows absolute Jumbo scores per harness', () => {
    const claude = makeComparison('claude-code', 0.9, 0.6);
    const codex = makeComparison('codex-cli', 0.8, 0.5);

    const output = formatCrossHarnessComparison([claude, codex]);

    expect(output).toContain('ABSOLUTE SCORES');
    expect(output).toContain('0.90/1.00');
    expect(output).toContain('0.80/1.00');
  });

  it('shows summary with highest Jumbo lift', () => {
    const claude = makeComparison('claude-code', 0.9, 0.6); // avg lift = 0.30
    const codex = makeComparison('codex-cli', 0.85, 0.4);   // avg lift = 0.45

    const output = formatCrossHarnessComparison([claude, codex]);

    expect(output).toContain('SUMMARY');
    expect(output).toContain('Highest Jumbo lift: codex-cli');
  });

  it('rejects comparisons spanning multiple scenarios', () => {
    const comp1 = makeComparison('claude-code', 0.9, 0.6);
    const comp2: ComparisonResult = {
      ...makeComparison('codex-cli', 0.8, 0.5),
      scenarioId: 'different-scenario',
    };

    const output = formatCrossHarnessComparison([comp1, comp2]);
    expect(output).toContain('multiple scenarios');
  });

  it('handles dimensions present in one harness but not another', () => {
    const claude = makeComparison('claude-code', 0.9, 0.6);
    const codex: ComparisonResult = {
      ...makeComparison('codex-cli', 0.8, 0.5),
      jumboScores: [{ dimension: 'file-accuracy', score: 0.8, maxScore: 1 }],
      baselineScores: [{ dimension: 'file-accuracy', score: 0.5, maxScore: 1 }],
      deltas: [{ dimension: 'file-accuracy', score: 0.3, maxScore: 1 }],
    };

    const output = formatCrossHarnessComparison([claude, codex]);

    // Should show n/a for knowledge-retention under codex
    expect(output).toContain('n/a');
  });
});
