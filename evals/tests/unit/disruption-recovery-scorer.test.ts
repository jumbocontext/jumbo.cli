import { describe, it, expect } from '@jest/globals';
import { scoreDisruptionRecovery, scoreDisruptionRecoveryTimeline } from '../../src/scoring/disruption-recovery-scorer.js';
import { createSessionRecord } from '../../src/domain/types.js';
import type { Disruption, WorkspaceSnapshot } from '../../src/domain/types.js';

function makeRecord(sessionNumber: number, opts: {
  agentOutput?: string;
  filesModified?: string[];
  workspaceSnapshot?: WorkspaceSnapshot;
} = {}) {
  return createSessionRecord({
    id: `rec-${sessionNumber}`,
    scenarioId: 'scenario-1',
    sessionNumber,
    harness: 'claude-code',
    agentOutput: opts.agentOutput ?? '',
    filesModified: opts.filesModified ?? [],
    transcript: '',
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

describe('scoreDisruptionRecovery', () => {
  it('returns perfect score when all recovery patterns persist in post-disruption sessions', () => {
    const disruptions: Disruption[] = [{
      type: 'correction',
      sessionNumber: 2,
      content: 'Use snake_case not camelCase',
      recoveryPatterns: ['snake_case'],
    }];

    const records = [
      makeRecord(1, { agentOutput: 'initial setup' }),
      makeRecord(2, { agentOutput: 'switching to snake_case' }),
      makeRecord(3, { agentOutput: 'continued with snake_case conventions' }),
    ];

    const score = scoreDisruptionRecovery(records, disruptions);
    expect(score.score).toBe(1);
    expect(score.dimension).toBe('disruption-recovery');
  });

  it('returns zero when recovery patterns are lost after disruption', () => {
    const disruptions: Disruption[] = [{
      type: 'correction',
      sessionNumber: 2,
      content: 'Use snake_case not camelCase',
      recoveryPatterns: ['snake_case'],
    }];

    const records = [
      makeRecord(1, { agentOutput: 'initial' }),
      makeRecord(2, { agentOutput: 'applied snake_case' }),
      makeRecord(3, { agentOutput: 'reverted to camelCase everywhere' }),
    ];

    const score = scoreDisruptionRecovery(records, disruptions);
    expect(score.score).toBe(0);
    expect(score.details).toContain('lost "snake_case"');
  });

  it('handles multiple disruptions with different recovery patterns', () => {
    const disruptions: Disruption[] = [
      {
        type: 'correction',
        sessionNumber: 2,
        content: 'Use snake_case',
        recoveryPatterns: ['snake_case'],
      },
      {
        type: 'new-constraint',
        sessionNumber: 3,
        content: 'Add error handling',
        recoveryPatterns: ['try', 'catch'],
      },
    ];

    const records = [
      makeRecord(1, { agentOutput: 'initial' }),
      makeRecord(2, { agentOutput: 'snake_case' }),
      makeRecord(3, { agentOutput: 'snake_case with try catch' }),
      makeRecord(4, { agentOutput: 'snake_case but no error handling' }),
    ];

    // Disruption 1 (session 2): post-sessions 3,4. snake_case in both → 2/2
    // Disruption 2 (session 3): post-session 4 only. try=no, catch=no → 0/2
    // Total: 2 pass out of 4 checks = 0.5
    const score = scoreDisruptionRecovery(records, disruptions);
    expect(score.score).toBe(0.5);
  });

  it('returns trivially satisfied when no disruptions defined', () => {
    const score = scoreDisruptionRecovery([makeRecord(1)], []);
    expect(score.score).toBe(1);
    expect(score.details).toContain('trivially satisfied');
  });

  it('uses workspace snapshot as primary evidence for recovery (correct code, terse transcript)', () => {
    const disruptions: Disruption[] = [{
      type: 'correction',
      sessionNumber: 2,
      content: 'Use snake_case',
      recoveryPatterns: ['snake_case'],
    }];

    // No mention of snake_case in output — but the file uses snake_case naming
    const records = [
      makeRecord(1, { agentOutput: 'initial' }),
      makeRecord(2, { agentOutput: 'updated' }),
      makeRecord(3, {
        agentOutput: 'done',
        workspaceSnapshot: makeSnapshot({ 'src/utils.ts': 'const snake_case_var = getValue();' }),
      }),
    ];

    // snake_case is not in agentOutput but is in the workspace file — should pass
    const score = scoreDisruptionRecovery(records, disruptions);
    expect(score.score).toBe(1);
  });

  it('rejects keyword-only transcript when workspace snapshot does not contain pattern', () => {
    const disruptions: Disruption[] = [{
      type: 'correction',
      sessionNumber: 2,
      content: 'Use snake_case',
      recoveryPatterns: ['snake_case'],
    }];

    // Transcript/output claims snake_case but workspace file only has camelCase
    const records = [
      makeRecord(1, { agentOutput: 'initial' }),
      makeRecord(2, { agentOutput: 'switched to snake_case' }),
      makeRecord(3, {
        agentOutput: 'still using snake_case',
        workspaceSnapshot: makeSnapshot({ 'src/utils.ts': 'const userName = getUserName();' }),
      }),
    ];

    const score = scoreDisruptionRecovery(records, disruptions);
    expect(score.score).toBe(0);
    expect(score.details).toContain('lost "snake_case"');
  });

  it('handles disruption at last session (no post-sessions to check)', () => {
    const disruptions: Disruption[] = [{
      type: 'correction',
      sessionNumber: 3,
      content: 'Fix something',
      recoveryPatterns: ['fix'],
    }];

    const records = [
      makeRecord(1, {}),
      makeRecord(2, {}),
      makeRecord(3, { agentOutput: 'applied fix' }),
    ];

    // No sessions after disruption to check
    const score = scoreDisruptionRecovery(records, disruptions);
    expect(score.score).toBe(1);
    expect(score.details).toContain('No recovery checks applicable');
  });
});

describe('scoreDisruptionRecoveryTimeline', () => {
  it('produces per-session timeline with recovery status', () => {
    const disruptions: Disruption[] = [{
      type: 'correction',
      sessionNumber: 2,
      content: 'Use snake_case',
      recoveryPatterns: ['snake_case'],
    }];

    const records = [
      makeRecord(1, { agentOutput: 'initial' }),
      makeRecord(2, { agentOutput: 'snake_case' }),
      makeRecord(3, { agentOutput: 'snake_case still' }),
      makeRecord(4, { agentOutput: 'forgot everything' }),
    ];

    const timeline = scoreDisruptionRecoveryTimeline(records, disruptions);

    expect(timeline).toHaveLength(4);
    expect(timeline[0].score).toBe(1);  // Session 1: no active disruptions yet
    expect(timeline[1].score).toBe(1);  // Session 2: disruption injected here, no active yet (< not <=)
    expect(timeline[2].score).toBe(1);  // Session 3: snake_case present
    expect(timeline[3].score).toBe(0);  // Session 4: lost
  });

  it('returns empty for no disruptions', () => {
    const timeline = scoreDisruptionRecoveryTimeline([makeRecord(1)], []);
    expect(timeline).toEqual([]);
  });
});
