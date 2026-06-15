import { describe, it, expect } from '@jest/globals';
import { scoreKnowledgeRetention, scoreKnowledgeRetentionTimeline } from '../../src/scoring/knowledge-retention-scorer.js';
import { createSessionRecord } from '../../src/domain/types.js';
import type { WorkspaceSnapshot } from '../../src/domain/types.js';

function makeRecord(sessionNumber: number, opts: {
  agentOutput?: string;
  filesModified?: string[];
  transcript?: string;
  workspaceSnapshot?: WorkspaceSnapshot;
} = {}) {
  return createSessionRecord({
    id: `rec-${sessionNumber}`,
    scenarioId: 'scenario-1',
    sessionNumber,
    harness: 'claude-code',
    agentOutput: opts.agentOutput ?? '',
    filesModified: opts.filesModified ?? [],
    transcript: opts.transcript ?? '',
    workspaceSnapshot: opts.workspaceSnapshot,
    startedAt: '2026-03-21T10:00:00Z',
    completedAt: '2026-03-21T10:05:00Z',
  });
}

function makeSnapshot(files: Record<string, string>): WorkspaceSnapshot {
  return {
    capturedAt: '2026-03-21T10:05:00Z',
    files: Object.entries(files).map(([path, content]) => ({ path, content })),
  };
}

describe('scoreKnowledgeRetention', () => {
  it('returns perfect score when all patterns are found in latest session', () => {
    const records = [
      makeRecord(1, { agentOutput: 'Using DependencyInversion and InterfaceSegregation' }),
      makeRecord(2, { agentOutput: 'Applied DependencyInversion pattern, followed InterfaceSegregation' }),
    ];

    const score = scoreKnowledgeRetention(records, ['DependencyInversion', 'InterfaceSegregation']);
    expect(score.score).toBe(1);
    expect(score.dimension).toBe('knowledge-retention');
  });

  it('returns zero when no patterns found in latest session', () => {
    const records = [
      makeRecord(1, { agentOutput: 'Using DependencyInversion and InterfaceSegregation' }),
      makeRecord(2, { agentOutput: 'Did something completely different' }),
    ];

    const score = scoreKnowledgeRetention(records, ['DependencyInversion', 'InterfaceSegregation']);
    expect(score.score).toBe(0);
    expect(score.details).toContain('lost: DependencyInversion, InterfaceSegregation');
  });

  it('handles partial retention', () => {
    const records = [
      makeRecord(1, { agentOutput: 'Pattern A and Pattern B' }),
      makeRecord(3, { agentOutput: 'Still using Pattern A but forgot B' }),
    ];

    const score = scoreKnowledgeRetention(records, ['Pattern A', 'Pattern B']);
    expect(score.score).toBe(0.5);
  });

  it('checks filesModified and transcript too', () => {
    const records = [
      makeRecord(1, { filesModified: ['src/auth-service.ts'], transcript: 'Created auth service' }),
      makeRecord(2, { filesModified: ['src/auth-service.ts'] }),
    ];

    const score = scoreKnowledgeRetention(records, ['auth-service']);
    expect(score.score).toBe(1);
  });

  it('is case-insensitive', () => {
    const records = [
      makeRecord(1, { agentOutput: 'SOLID principles' }),
      makeRecord(2, { agentOutput: 'Applied solid Principles' }),
    ];

    const score = scoreKnowledgeRetention(records, ['SOLID']);
    expect(score.score).toBe(1);
  });

  it('returns trivial score when no patterns defined', () => {
    const score = scoreKnowledgeRetention([makeRecord(1)], []);
    expect(score.score).toBe(1);
    expect(score.details).toContain('trivially satisfied');
  });

  it('uses workspace snapshot content as primary evidence (correct code, terse transcript)', () => {
    // Transcript says nothing — but the file actually implements the pattern
    const records = [
      makeRecord(1, { agentOutput: 'Setup done' }),
      makeRecord(2, {
        agentOutput: 'done',
        transcript: '',
        workspaceSnapshot: makeSnapshot({
          'src/service.ts': 'export class AuthService { constructor() {} }',
        }),
      }),
    ];

    const score = scoreKnowledgeRetention(records, ['AuthService']);
    expect(score.score).toBe(1);
  });

  it('rejects keyword-only transcript when workspace snapshot exists without the pattern', () => {
    // Transcript mentions the keyword, but the actual file does not implement it
    const records = [
      makeRecord(1, { agentOutput: 'Added DependencyInversion' }),
      makeRecord(2, {
        agentOutput: 'Applied DependencyInversion pattern',
        transcript: 'I used DependencyInversion throughout',
        workspaceSnapshot: makeSnapshot({
          'src/index.ts': 'function doStuff() { return 42; }',
        }),
      }),
    ];

    const score = scoreKnowledgeRetention(records, ['DependencyInversion']);
    expect(score.score).toBe(0);
    expect(score.details).toContain('lost: DependencyInversion');
  });

  it('falls back to transcript/output when no workspace snapshot present', () => {
    const records = [
      makeRecord(1, { agentOutput: 'Initial setup' }),
      makeRecord(2, { agentOutput: 'Applied DependencyInversion' }),
    ];

    const score = scoreKnowledgeRetention(records, ['DependencyInversion']);
    expect(score.score).toBe(1);
  });

  it('evaluates latest session by sessionNumber, not array position', () => {
    const records = [
      makeRecord(3, { agentOutput: 'Has the pattern' }),
      makeRecord(1, { agentOutput: 'Also has the pattern' }),
      makeRecord(2, { agentOutput: 'No pattern here' }),
    ];

    // Latest is session 3 which has the pattern
    const score = scoreKnowledgeRetention(records, ['pattern']);
    expect(score.score).toBe(1);
  });
});

describe('scoreKnowledgeRetentionTimeline', () => {
  it('produces one score per session in order', () => {
    const records = [
      makeRecord(1, { agentOutput: 'Pattern A and Pattern B' }),
      makeRecord(2, { agentOutput: 'Pattern A only' }),
      makeRecord(3, { agentOutput: 'Neither pattern' }),
    ];

    const timeline = scoreKnowledgeRetentionTimeline(records, ['Pattern A', 'Pattern B']);

    expect(timeline).toHaveLength(3);
    expect(timeline[0].score).toBe(1);     // Session 1: both patterns
    expect(timeline[1].score).toBe(0.5);   // Session 2: one pattern
    expect(timeline[2].score).toBe(0);     // Session 3: no patterns
  });

  it('returns empty array when no patterns defined', () => {
    const timeline = scoreKnowledgeRetentionTimeline([makeRecord(1)], []);
    expect(timeline).toEqual([]);
  });

  it('sorts by session number', () => {
    const records = [
      makeRecord(3, { agentOutput: 'no match' }),
      makeRecord(1, { agentOutput: 'Pattern A' }),
      makeRecord(2, { agentOutput: 'Pattern A' }),
    ];

    const timeline = scoreKnowledgeRetentionTimeline(records, ['Pattern A']);
    expect(timeline[0].details).toContain('session 1');
    expect(timeline[1].details).toContain('session 2');
    expect(timeline[2].details).toContain('session 3');
  });
});
