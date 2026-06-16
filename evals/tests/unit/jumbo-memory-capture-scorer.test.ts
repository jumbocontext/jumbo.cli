import { describe, expect, it } from '@jest/globals';
import { baselineJumboMemoryCaptureScore, scoreJumboMemoryCapture } from '../../src/scoring/jumbo-memory-capture-scorer.js';
import { createSessionRecord } from '../../src/domain/types.js';
import type { JumboMemoryEntity, JumboMemorySnapshot, SessionRecord } from '../../src/domain/types.js';

function snap(sessionNumber: number, entities: JumboMemoryEntity[]): JumboMemorySnapshot {
  return {
    sessionNumber,
    capturedAt: '2026-04-26T10:00:00Z',
    entities,
    commands: [],
  };
}

function record(
  sessionNumber: number,
  before: JumboMemoryEntity[],
  after: JumboMemoryEntity[],
): SessionRecord {
  return createSessionRecord({
    id: `rec-${sessionNumber}`,
    scenarioId: 'scenario-memory',
    sessionNumber,
    harness: 'mock',
    variant: 'jumbo',
    agentOutput: 'done',
    filesModified: [],
    transcript: 'transcript',
    jumboMemorySnapshotBefore: snap(sessionNumber, before),
    jumboMemorySnapshot: snap(sessionNumber, after),
    startedAt: '2026-04-26T10:00:00Z',
    completedAt: '2026-04-26T10:01:00Z',
  });
}

describe('scoreJumboMemoryCapture (snapshot-diff)', () => {
  it('credits entities that appear only in the post-session snapshot', () => {
    const score = scoreJumboMemoryCapture(
      [
        record(
          1,
          [],
          [
            { kind: 'decision', id: 'dec-1', text: 'Commander for CLI framework', raw: {} },
            { kind: 'component', id: 'cmp-1', text: 'TaskStore persists tasks', raw: {} },
          ],
        ),
      ],
      [
        { kind: 'decision', match: 'Commander for CLI' },
        { kind: 'component', match: 'TaskStore' },
      ],
    );

    expect(score.dimension).toBe('jumbo-memory-capture');
    expect(score.score).toBe(1);
    expect(score.details).toContain('precision=1.00');
    expect(score.details).toContain('recall=1.00');
    expect(score.details).toContain('new-entities=2');
    expect(score.details).toContain('spurious: none');
  });

  it('ignores entities already present in the pre-session snapshot (no harness-side mirroring)', () => {
    // The agent did not register anything new this session — both decisions
    // were already in the pre-snapshot (preSeededMemory or prior session).
    const preExisting: JumboMemoryEntity[] = [
      { kind: 'decision', id: 'dec-1', text: 'Commander for CLI framework', raw: {} },
    ];
    const score = scoreJumboMemoryCapture(
      [record(1, preExisting, preExisting)],
      [{ kind: 'decision', match: 'Commander for CLI' }],
    );

    expect(score.score).toBe(0);
    expect(score.details).toContain('new-entities=0');
    expect(score.details).toContain('missing: decision:Commander for CLI');
  });

  it('flags missing and spurious memories among new entities only', () => {
    const score = scoreJumboMemoryCapture(
      [
        record(
          1,
          [],
          [
            { kind: 'decision', id: 'dec-1', text: 'Use ad hoc argument parsing', raw: {} },
          ],
        ),
      ],
      [{ kind: 'decision', match: 'Commander for CLI' }],
    );

    expect(score.score).toBe(0);
    expect(score.details).toContain('missing: decision:Commander for CLI');
    expect(score.details).toContain('spurious: decision:Use ad hoc argument parsing');
  });

  it('matches expected captures with sessionNumber against the session window in which they appeared', () => {
    const score = scoreJumboMemoryCapture(
      [
        record(1, [], [{ kind: 'decision', id: 'd1', text: 'Adopt event sourcing', raw: {} }]),
        record(2,
          [{ kind: 'decision', id: 'd1', text: 'Adopt event sourcing', raw: {} }],
          [
            { kind: 'decision', id: 'd1', text: 'Adopt event sourcing', raw: {} },
            { kind: 'invariant', id: 'i1', text: 'No mocks in integration tests', raw: {} },
          ],
        ),
      ],
      [
        { kind: 'decision', match: 'event sourcing', sessionNumber: 1 },
        { kind: 'invariant', match: 'No mocks', sessionNumber: 2 },
      ],
    );

    expect(score.score).toBe(1);
    expect(score.details).toContain('recall=1.00');
  });

  it('does not penalize baseline runs for missing Jumbo memory', () => {
    const score = baselineJumboMemoryCaptureScore([
      { kind: 'invariant', match: 'Use append-only history' },
    ]);

    expect(score.dimension).toBe('jumbo-memory-capture');
    expect(score.score).toBe(0);
    expect(score.maxScore).toBe(0);
    expect(score.details).toContain('baseline runs do not use Jumbo project memory');
  });
});
