import { describe, it, expect } from '@jest/globals';
import { scoreFileAccuracy } from '../../src/scoring/file-accuracy-scorer.js';
import { createSessionRecord } from '../../src/domain/types.js';
import type { WorkspaceSnapshot } from '../../src/domain/types.js';

function makeRecord(filesModified: string[], workspaceSnapshot?: WorkspaceSnapshot): ReturnType<typeof createSessionRecord> {
  return createSessionRecord({
    id: 'rec-1',
    scenarioId: 'scenario-1',
    sessionNumber: 1,
    harness: 'claude-code',
    agentOutput: '',
    filesModified,
    transcript: '',
    workspaceSnapshot,
    startedAt: '2026-03-21T10:00:00Z',
    completedAt: '2026-03-21T10:05:00Z',
  });
}

function makeSnapshot(paths: string[]): WorkspaceSnapshot {
  return {
    capturedAt: '2026-03-21T10:05:00Z',
    files: paths.map((path) => ({ path, content: '' })),
  };
}

describe('scoreFileAccuracy', () => {
  it('returns perfect score when all expected files are modified and nothing extra', () => {
    const record = makeRecord(['src/index.ts', 'src/utils.ts']);
    const score = scoreFileAccuracy([record], ['src/index.ts', 'src/utils.ts']);

    expect(score.dimension).toBe('file-accuracy');
    expect(score.score).toBe(1);
    expect(score.maxScore).toBe(1);
  });

  it('returns zero when no expected files are modified', () => {
    const record = makeRecord(['src/other.ts']);
    const score = scoreFileAccuracy([record], ['src/index.ts', 'src/utils.ts']);

    expect(score.score).toBe(0);
  });

  it('handles partial match', () => {
    const record = makeRecord(['src/index.ts']);
    const score = scoreFileAccuracy([record], ['src/index.ts', 'src/utils.ts']);

    // precision=1 (1/1), recall=0.5 (1/2), f1=0.67
    expect(score.score).toBeCloseTo(0.67, 1);
    expect(score.details).toContain('1/2 expected files modified');
    expect(score.details).toContain('missed: src/utils.ts');
  });

  it('penalizes unexpected files via precision', () => {
    const record = makeRecord(['src/index.ts', 'src/utils.ts', 'src/junk.ts']);
    const score = scoreFileAccuracy([record], ['src/index.ts', 'src/utils.ts']);

    // precision=2/3, recall=1, f1=0.8
    expect(score.score).toBeCloseTo(0.8, 1);
    expect(score.details).toContain('unexpected: src/junk.ts');
  });

  it('returns trivial score when no expected files defined', () => {
    const record = makeRecord(['anything.ts']);
    const score = scoreFileAccuracy([record], []);

    expect(score.score).toBe(1);
    expect(score.details).toContain('trivially satisfied');
  });

  it('aggregates files across multiple session records', () => {
    const rec1 = makeRecord(['src/index.ts']);
    const rec2 = createSessionRecord({
      id: 'rec-2',
      scenarioId: 'scenario-1',
      sessionNumber: 2,
      harness: 'claude-code',
      agentOutput: '',
      filesModified: ['src/utils.ts'],
      transcript: '',
      startedAt: '2026-03-21T10:05:00Z',
      completedAt: '2026-03-21T10:10:00Z',
    });

    const score = scoreFileAccuracy([rec1, rec2], ['src/index.ts', 'src/utils.ts']);
    expect(score.score).toBe(1);
  });

  it('returns zero for empty session records and non-empty expected files', () => {
    const score = scoreFileAccuracy([], ['src/index.ts']);

    expect(score.score).toBe(0);
    expect(score.details).toContain('missed: src/index.ts');
  });

  it('uses workspace snapshot file paths when harness metadata is missing', () => {
    // filesModified is empty (harness did not report it), but workspace snapshot has the files
    const record = makeRecord([], makeSnapshot(['src/index.ts', 'src/utils.ts']));
    const score = scoreFileAccuracy([record], ['src/index.ts', 'src/utils.ts']);

    expect(score.score).toBe(1);
    expect(score.details).toContain('2/2 expected files modified');
  });

  it('prefers harness filesModified over workspace snapshot when both present', () => {
    // Harness says only index.ts was modified; snapshot has both — should trust harness
    const record = makeRecord(['src/index.ts'], makeSnapshot(['src/index.ts', 'src/utils.ts']));
    const score = scoreFileAccuracy([record], ['src/index.ts', 'src/utils.ts']);

    // precision=1 (1/1), recall=0.5 (1/2), f1≈0.67 — harness data wins
    expect(score.score).toBeCloseTo(0.67, 1);
    expect(score.details).toContain('missed: src/utils.ts');
  });

  it('returns zero with empty filesModified and no workspace snapshot', () => {
    const record = makeRecord([]);
    const score = scoreFileAccuracy([record], ['src/index.ts']);

    expect(score.score).toBe(0);
    expect(score.details).toContain('missed: src/index.ts');
  });
});
