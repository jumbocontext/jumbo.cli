import { describe, it, expect } from '@jest/globals';
import {
  scoreJumboEventCapture,
  baselineJumboEventCaptureScore,
  scoreJumboEventCaptureTimeline,
  resolveAddedEventTypeForKind,
  addedEventTypeByKind,
} from '../../src/scoring/jumbo-event-capture-scorer.js';
import { createSessionRecord } from '../../src/domain/index.js';
import type { ExpectedJumboMemoryCapture, SessionRecord } from '../../src/domain/index.js';

function record(sessionNumber: number, countsByType?: Record<string, number>): SessionRecord {
  const files: { path: string; content: string }[] = [];
  return createSessionRecord({
    id: `r${sessionNumber}`,
    scenarioId: 's',
    sessionNumber,
    harness: 'claude-code',
    agentOutput: '',
    filesModified: [],
    transcript: '',
    workspaceSnapshot: {
      capturedAt: '2026-03-21T10:05:00Z',
      files,
      ...(countsByType
        ? {
            jumboEvents: {
              capturedAt: '2026-03-21T10:05:00Z',
              aggregateCount: Object.keys(countsByType).length,
              eventCount: Object.values(countsByType).reduce((a, b) => a + b, 0),
              countsByType,
              fileNames: [],
            },
          }
        : {}),
    },
    startedAt: '2026-03-21T10:00:00Z',
    completedAt: '2026-03-21T10:05:00Z',
  });
}

const expected: ExpectedJumboMemoryCapture[] = [
  { kind: 'decision', match: 'event sourcing' },
  { kind: 'component', match: 'EventStore' },
];

describe('scoreJumboEventCapture', () => {
  it('scores 1.0 when every expected kind is evidenced in the latest event log', () => {
    const records = [record(1, { DecisionAddedEvent: 1, ComponentAddedEvent: 2, WorkerIdentifiedEvent: 3 })];
    expect(scoreJumboEventCapture(records, expected).score).toBe(1);
  });

  it('scores partially when only some expected kinds are evidenced', () => {
    const records = [record(1, { DecisionAddedEvent: 1 })];
    const score = scoreJumboEventCapture(records, expected);
    expect(score.score).toBe(0.5);
    expect(score.details).toContain('ComponentAddedEvent');
  });

  it('scores 0 when the latest snapshot has no jumboEvents', () => {
    const records = [record(1)]; // workspace snapshot but no .jumbo/events
    expect(scoreJumboEventCapture(records, expected).score).toBe(0);
  });

  it('uses the latest session that carries an event log', () => {
    const records = [
      record(1, { DecisionAddedEvent: 1 }),
      record(2, { DecisionAddedEvent: 1, ComponentAddedEvent: 1 }),
    ];
    expect(scoreJumboEventCapture(records, expected).score).toBe(1);
  });

  it('is trivially satisfied when no captures are expected', () => {
    const records = [record(1)];
    expect(scoreJumboEventCapture(records, []).score).toBe(1);
  });

  it('counts distinct kinds, not individual expectations', () => {
    const twoDecisions: ExpectedJumboMemoryCapture[] = [
      { kind: 'decision', match: 'a' },
      { kind: 'decision', match: 'b' },
    ];
    const records = [record(1, { DecisionAddedEvent: 1 })];
    expect(scoreJumboEventCapture(records, twoDecisions).score).toBe(1);
  });
});

describe('resolveAddedEventTypeForKind', () => {
  it('maps every memory kind to its explicit Added-event type', () => {
    expect(resolveAddedEventTypeForKind('decision')).toBe('DecisionAddedEvent');
    expect(resolveAddedEventTypeForKind('guideline')).toBe('GuidelineAddedEvent');
    expect(resolveAddedEventTypeForKind('invariant')).toBe('InvariantAddedEvent');
    expect(resolveAddedEventTypeForKind('component')).toBe('ComponentAddedEvent');
    expect(resolveAddedEventTypeForKind('relation')).toBe('RelationAddedEvent');
    expect(resolveAddedEventTypeForKind('dependency')).toBe('DependencyAddedEvent');
  });

  it('covers exactly the six memory kinds (registry is exhaustive)', () => {
    expect(Object.keys(addedEventTypeByKind).sort()).toEqual(
      ['component', 'decision', 'dependency', 'guideline', 'invariant', 'relation'],
    );
  });
});

describe('baselineJumboEventCaptureScore', () => {
  it('is a trivial zero for the baseline arm (no .jumbo/events)', () => {
    const score = baselineJumboEventCaptureScore(expected);
    expect(score.dimension).toBe('jumbo-event-capture');
    expect(score.score).toBe(0);
  });
});

describe('scoreJumboEventCaptureTimeline', () => {
  it('produces one score per session, cumulative to that session', () => {
    const records = [
      record(1, { DecisionAddedEvent: 1 }),
      record(2, { DecisionAddedEvent: 1, ComponentAddedEvent: 1 }),
    ];
    const timeline = scoreJumboEventCaptureTimeline(records, expected);
    expect(timeline).toHaveLength(2);
    expect(timeline[0].score).toBe(0.5);
    expect(timeline[1].score).toBe(1);
  });
});
