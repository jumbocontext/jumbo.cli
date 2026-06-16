import { describe, it, expect } from '@jest/globals';
import { formatComparisonOutput } from '../../src/output/comparison-display.js';
import { createComparisonResult, createTestResult, createSessionRecord } from '../../src/domain/types.js';
import type { DimensionScore } from '../../src/domain/types.js';

describe('formatComparisonOutput', () => {
  it('produces formatted terminal output with scores and deltas', () => {
    const jumboRecord = createSessionRecord({
      id: 'jr-1', scenarioId: 'scenario-1', sessionNumber: 1, harness: 'claude-code',
      agentOutput: 'output', filesModified: ['src/index.ts', 'src/utils.ts'],
      transcript: '', startedAt: '', completedAt: '',
    });

    const baselineRecord = createSessionRecord({
      id: 'br-1', scenarioId: 'scenario-1', sessionNumber: 1, harness: 'claude-code',
      agentOutput: 'output', filesModified: ['src/index.ts'],
      transcript: '', startedAt: '', completedAt: '',
    });

    const jumboResult = createTestResult({
      id: 'jr', scenarioId: 'scenario-1', harness: 'claude-code', sessionRecords: [jumboRecord],
    });

    const baselineResult = createTestResult({
      id: 'br', scenarioId: 'scenario-1', harness: 'claude-code', sessionRecords: [baselineRecord],
    });

    const jumboScores: DimensionScore[] = [{ dimension: 'file-accuracy', score: 1.0, maxScore: 1 }];
    const baselineScores: DimensionScore[] = [{ dimension: 'file-accuracy', score: 0.67, maxScore: 1 }];
    const deltas: DimensionScore[] = [{ dimension: 'file-accuracy', score: 0.33, maxScore: 1 }];

    const comparison = createComparisonResult({
      id: 'cmp-1', scenarioId: 'scenario-1', harness: 'claude-code',
      jumboResult, baselineResult, jumboScores, baselineScores, deltas,
    });

    const output = formatComparisonOutput(comparison);

    expect(output).toContain('A/B Comparison: scenario-1');
    expect(output).toContain('JUMBO RUN');
    expect(output).toContain('BASELINE RUN');
    expect(output).toContain('file-accuracy');
    expect(output).toContain('1.00/1.00');
    expect(output).toContain('0.67/1.00');
    expect(output).toContain('+0.33');
    expect(output).toContain('2 files modified');
    expect(output).toContain('1 files modified');
  });

  it('shows negative delta when baseline outperforms jumbo', () => {
    const jumboRecord = createSessionRecord({
      id: 'jr-1', scenarioId: 's1', sessionNumber: 1, harness: 'h',
      agentOutput: '', filesModified: [], transcript: '', startedAt: '', completedAt: '',
    });
    const baselineRecord = createSessionRecord({
      id: 'br-1', scenarioId: 's1', sessionNumber: 1, harness: 'h',
      agentOutput: '', filesModified: ['file.ts'], transcript: '', startedAt: '', completedAt: '',
    });

    const comparison = createComparisonResult({
      id: 'cmp', scenarioId: 's1', harness: 'h',
      jumboResult: createTestResult({ id: 'jr', scenarioId: 's1', harness: 'h', sessionRecords: [jumboRecord] }),
      baselineResult: createTestResult({ id: 'br', scenarioId: 's1', harness: 'h', sessionRecords: [baselineRecord] }),
      jumboScores: [{ dimension: 'file-accuracy', score: 0, maxScore: 1 }],
      baselineScores: [{ dimension: 'file-accuracy', score: 0.5, maxScore: 1 }],
      deltas: [{ dimension: 'file-accuracy', score: -0.5, maxScore: 1 }],
    });

    const output = formatComparisonOutput(comparison);
    expect(output).toContain('-0.50');
  });

  it('shows Jumbo memory capture evidence separately from the scores table', () => {
    const jumboRecord = createSessionRecord({
      id: 'jr-1', scenarioId: 's1', sessionNumber: 1, harness: 'h',
      agentOutput: '', filesModified: [], transcript: '', startedAt: '', completedAt: '',
    });
    const baselineRecord = createSessionRecord({
      id: 'br-1', scenarioId: 's1', sessionNumber: 1, harness: 'h',
      agentOutput: '', filesModified: [], transcript: '', startedAt: '', completedAt: '',
    });

    const comparison = createComparisonResult({
      id: 'cmp', scenarioId: 's1', harness: 'h',
      jumboResult: createTestResult({ id: 'jr', scenarioId: 's1', harness: 'h', sessionRecords: [jumboRecord] }),
      baselineResult: createTestResult({ id: 'br', scenarioId: 's1', harness: 'h', sessionRecords: [baselineRecord] }),
      jumboScores: [{ dimension: 'jumbo-memory-capture', score: 1, maxScore: 1, details: 'precision=1.00; recall=1.00' }],
      baselineScores: [{ dimension: 'jumbo-memory-capture', score: 0, maxScore: 0, details: 'Not applicable: baseline runs do not use Jumbo project memory.' }],
      deltas: [{ dimension: 'jumbo-memory-capture', score: 1, maxScore: 1 }],
    });

    const output = formatComparisonOutput(comparison);
    expect(output).toContain('JUMBO MEMORY CAPTURE EVIDENCE');
    expect(output).toContain('Jumbo: precision=1.00; recall=1.00');
    expect(output).toContain('Baseline: Not applicable');
  });
});
