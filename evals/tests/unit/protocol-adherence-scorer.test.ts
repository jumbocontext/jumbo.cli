import { describe, expect, it } from '@jest/globals';
import {
  adherenceForSession,
  baselineProtocolAdherenceScore,
  scoreProtocolAdherence,
  scoreProtocolAdherenceTimeline,
} from '../../src/scoring/protocol-adherence-scorer.js';
import { createSessionRecord } from '../../src/domain/types.js';
import type { JumboLifecycleAudit, SessionRecord } from '../../src/domain/types.js';

function audit(overrides: Partial<JumboLifecycleAudit> = {}): JumboLifecycleAudit {
  return {
    sessionStartExecuted: true,
    goalStartExecuted: true,
    inSessionCapturesExecuted: true,
    progressUpdatesExecuted: true,
    goalSubmitExecuted: true,
    sessionEndExecuted: true,
    sessionsTotalDelta: 1,
    sessionsEndedDelta: 1,
    newEntityCount: 0,
    evidence: {},
    ...overrides,
  };
}

function record(sessionNumber: number, a: JumboLifecycleAudit | undefined): SessionRecord {
  return createSessionRecord({
    id: `r-${sessionNumber}`,
    scenarioId: 's',
    sessionNumber,
    harness: 'mock',
    variant: 'jumbo',
    agentOutput: '',
    filesModified: [],
    transcript: '',
    jumboLifecycleAudit: a,
    startedAt: '',
    completedAt: '',
  });
}

describe('adherenceForSession', () => {
  it('returns score=1 when every prescribed step is recorded as executed', () => {
    const result = adherenceForSession(record(1, audit()));
    expect(result.score).toBe(1);
    expect(result.steps).toHaveLength(6);
    expect(result.steps.every((s) => s.passed)).toBe(true);
  });

  it('returns score=0 when no audit exists (e.g. baseline session)', () => {
    const result = adherenceForSession(record(1, undefined));
    expect(result.score).toBe(0);
    expect(result.steps).toHaveLength(0);
  });

  it('emits per-step pass/fail when only some steps executed', () => {
    const result = adherenceForSession(
      record(
        1,
        audit({
          inSessionCapturesExecuted: false,
          progressUpdatesExecuted: false,
        }),
      ),
    );
    expect(result.steps.find((s) => s.step === 'session-start')?.passed).toBe(true);
    expect(result.steps.find((s) => s.step === 'in-session-captures')?.passed).toBe(false);
    expect(result.steps.find((s) => s.step === 'progress-updates')?.passed).toBe(false);
    expect(result.score).toBeCloseTo(4 / 6, 4);
  });
});

describe('scoreProtocolAdherence', () => {
  it('averages per-session scores across audited sessions', () => {
    const score = scoreProtocolAdherence([
      record(1, audit()),
      record(
        2,
        audit({ progressUpdatesExecuted: false, goalSubmitExecuted: false }),
      ),
    ]);

    expect(score.dimension).toBe('protocol-adherence');
    // Session 1: 6/6 = 1.00. Session 2: 4/6 ≈ 0.667. Mean ≈ 0.833 → rounds to 0.83.
    expect(score.score).toBe(0.83);
    expect(score.maxScore).toBe(1);
    expect(score.details).toContain('sessions-audited=2');
    expect(score.details).toContain('steps-passed=10/12');
    expect(score.details).toContain('progress-updates-missed-in-sessions:2');
    expect(score.details).toContain('goal-submit-missed-in-sessions:2');
  });

  it('reports zero with explanatory details when no sessions have an audit', () => {
    const score = scoreProtocolAdherence([record(1, undefined)]);
    expect(score.score).toBe(0);
    expect(score.maxScore).toBe(1);
    expect(score.details).toContain('cannot be measured');
  });

  it('reports all-steps-passed when every session passed every step', () => {
    const score = scoreProtocolAdherence([record(1, audit()), record(2, audit())]);
    expect(score.details).toContain('all-steps-passed');
    expect(score.score).toBe(1);
  });

  it('keeps the baseline arm at maxScore=0 (N/A)', () => {
    const score = baselineProtocolAdherenceScore();
    expect(score.dimension).toBe('protocol-adherence');
    expect(score.score).toBe(0);
    expect(score.maxScore).toBe(0);
    expect(score.details).toContain('Not applicable');
  });
});

describe('scoreProtocolAdherenceTimeline', () => {
  it('emits a per-session DimensionScore with passed/failed step lists', () => {
    const timeline = scoreProtocolAdherenceTimeline([
      record(1, audit()),
      record(2, audit({ goalSubmitExecuted: false, sessionEndExecuted: false })),
    ]);

    expect(timeline).toHaveLength(2);
    expect(timeline[0].score).toBe(1);
    expect(timeline[0].details).toContain('passed:');
    expect(timeline[0].details).toContain('failed: none');
    expect(timeline[1].score).toBeCloseTo(4 / 6, 1);
    expect(timeline[1].details).toContain('failed: goal-submit,session-end');
  });

  it('emits a sentinel entry for sessions without an audit', () => {
    const timeline = scoreProtocolAdherenceTimeline([record(1, undefined)]);
    expect(timeline[0].score).toBe(0);
    expect(timeline[0].details).toContain('No lifecycle audit');
  });
});
