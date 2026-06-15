import { describe, it, expect } from '@jest/globals';
import { scoreTokenEfficiency, compareTokenEfficiency, tokenUsageTimeline } from '../../src/scoring/token-efficiency-scorer.js';
import { createSessionRecord } from '../../src/domain/types.js';

function makeRecord(sessionNumber: number, inputTokens?: number, outputTokens?: number) {
  return createSessionRecord({
    id: `rec-${sessionNumber}`,
    scenarioId: 'scenario-1',
    sessionNumber,
    harness: 'claude-code',
    agentOutput: '',
    filesModified: [],
    transcript: '',
    inputTokens,
    outputTokens,
    startedAt: '2026-03-21T10:00:00Z',
    completedAt: '2026-03-21T10:05:00Z',
  });
}

describe('scoreTokenEfficiency', () => {
  it('computes total tokens and tokens per quality point', () => {
    const records = [
      makeRecord(1, 1000, 500),
      makeRecord(2, 800, 400),
    ];

    const score = scoreTokenEfficiency(records, 0.8);
    expect(score.dimension).toBe('token-efficiency');
    expect(score.score).toBe(2700); // 1000+500+800+400
    expect(score.details).toContain('2700 total tokens');
    expect(score.details).toContain('1800 in');
    expect(score.details).toContain('900 out');
    expect(score.details).toContain('3375 tokens/quality-point'); // 2700/0.8
  });

  it('returns zero score when no token data', () => {
    const records = [makeRecord(1)];
    const score = scoreTokenEfficiency(records, 0.8);
    expect(score.score).toBe(0);
    expect(score.details).toContain('No token data');
  });
});

describe('compareTokenEfficiency', () => {
  it('returns positive when Jumbo uses fewer tokens per quality point', () => {
    const jumboRecords = [makeRecord(1, 500, 200)];   // 700 tokens, quality 0.8 → 875 tpq
    const baselineRecords = [makeRecord(1, 1000, 500)]; // 1500 tokens, quality 0.8 → 1875 tpq

    const score = compareTokenEfficiency(jumboRecords, baselineRecords, 0.8, 0.8);
    expect(score.score).toBeGreaterThan(0);
    expect(score.details).toContain('jumbo: 700 tokens');
    expect(score.details).toContain('baseline: 1500 tokens');
  });

  it('returns negative when baseline is more efficient', () => {
    const jumboRecords = [makeRecord(1, 2000, 1000)];
    const baselineRecords = [makeRecord(1, 500, 200)];

    const score = compareTokenEfficiency(jumboRecords, baselineRecords, 0.8, 0.8);
    expect(score.score).toBeLessThan(0);
  });

  it('returns zero when both have no token data', () => {
    const score = compareTokenEfficiency([makeRecord(1)], [makeRecord(1)], 0.5, 0.5);
    expect(score.score).toBe(0);
  });

  it('accounts for quality differences', () => {
    // Jumbo: 1000 tokens, quality 1.0 → 1000 tpq
    // Baseline: 1000 tokens, quality 0.5 → 2000 tpq
    // Jumbo is more efficient per quality point
    const jumboRecords = [makeRecord(1, 600, 400)];
    const baselineRecords = [makeRecord(1, 600, 400)];

    const score = compareTokenEfficiency(jumboRecords, baselineRecords, 1.0, 0.5);
    expect(score.score).toBeGreaterThan(0);
  });
});

describe('tokenUsageTimeline', () => {
  it('produces per-session token usage', () => {
    const records = [
      makeRecord(1, 1000, 500),
      makeRecord(2, 800, 400),
      makeRecord(3, 600, 300),
    ];

    const timeline = tokenUsageTimeline(records);
    expect(timeline).toHaveLength(3);
    expect(timeline[0].score).toBe(1500);
    expect(timeline[1].score).toBe(1200);
    expect(timeline[2].score).toBe(900);
    expect(timeline[0].dimension).toBe('token-usage');
  });

  it('handles missing token data gracefully', () => {
    const records = [makeRecord(1), makeRecord(2, 100, 50)];
    const timeline = tokenUsageTimeline(records);
    expect(timeline[0].score).toBe(0);
    expect(timeline[1].score).toBe(150);
  });
});
