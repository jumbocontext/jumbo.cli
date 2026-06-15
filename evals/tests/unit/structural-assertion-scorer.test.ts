import { describe, it, expect } from '@jest/globals';
import {
  scoreStructuralAssertions,
  scoreStructuralAssertionsTimeline,
} from '../../src/scoring/structural-assertion-scorer.js';
import { createSessionRecord } from '../../src/domain/index.js';
import type { SessionRecord, StructuralAssertion, WorkspaceSnapshot } from '../../src/domain/index.js';

function makeSnapshot(files: Record<string, string>): WorkspaceSnapshot {
  return {
    capturedAt: '2026-03-21T10:05:00Z',
    files: Object.entries(files).map(([path, content]) => ({ path, content })),
  };
}

function makeRecord(sessionNumber: number, files?: Record<string, string>): SessionRecord {
  return createSessionRecord({
    id: `rec-${sessionNumber}`,
    scenarioId: 'scenario-1',
    sessionNumber,
    harness: 'claude-code',
    agentOutput: '',
    filesModified: [],
    transcript: '',
    workspaceSnapshot: files ? makeSnapshot(files) : undefined,
    startedAt: '2026-03-21T10:00:00Z',
    completedAt: '2026-03-21T10:05:00Z',
  });
}

describe('scoreStructuralAssertions', () => {
  it('returns trivial score when no assertions are defined', () => {
    const score = scoreStructuralAssertions([makeRecord(1)], []);
    expect(score.dimension).toBe('structural-retention');
    expect(score.score).toBe(1);
    expect(score.maxScore).toBe(1);
    expect(score.details).toContain('No structural assertions');
  });

  it('passes a fileExists assertion when a matching file is present in the due session', () => {
    const assertions: StructuralAssertion[] = [
      { id: 'a1', file: 'src/events/types.ts', sessionNumber: 1, matcher: { kind: 'fileExists' } },
    ];
    const records = [makeRecord(1, { 'src/events/types.ts': 'export type X = 1;' })];

    const score = scoreStructuralAssertions(records, assertions);
    expect(score.score).toBe(1);
  });

  it('fails a fileExists assertion when no file matches the glob', () => {
    const assertions: StructuralAssertion[] = [
      { id: 'a1', file: 'src/events/types.ts', sessionNumber: 1, matcher: { kind: 'fileExists' } },
    ];
    const records = [makeRecord(1, { 'src/other.ts': 'noop' })];

    const score = scoreStructuralAssertions(records, assertions);
    expect(score.score).toBe(0);
    expect(score.details).toContain('a1');
  });

  it('evaluates matchesRegex against the matched file content', () => {
    const assertions: StructuralAssertion[] = [
      {
        id: 'discriminated-union',
        file: 'src/events/types.ts',
        sessionNumber: 1,
        matcher: { kind: 'matchesRegex', pattern: "type\\s+DomainEvent\\s*=" },
      },
    ];
    const pass = scoreStructuralAssertions(
      [makeRecord(1, { 'src/events/types.ts': 'export type DomainEvent = A | B;' })],
      assertions,
    );
    expect(pass.score).toBe(1);

    const fail = scoreStructuralAssertions(
      [makeRecord(1, { 'src/events/types.ts': 'export interface DomainEvent {}' })],
      assertions,
    );
    expect(fail.score).toBe(0);
  });

  it('honours regex flags', () => {
    const assertions: StructuralAssertion[] = [
      {
        id: 'a1',
        file: 'src/a.ts',
        sessionNumber: 1,
        matcher: { kind: 'matchesRegex', pattern: 'CONCURRENCYERROR', flags: 'i' },
      },
    ];
    const score = scoreStructuralAssertions(
      [makeRecord(1, { 'src/a.ts': 'class ConcurrencyError extends Error {}' })],
      assertions,
    );
    expect(score.score).toBe(1);
  });

  it('containsAll passes only when every substring is present across matched files', () => {
    const assertions: StructuralAssertion[] = [
      {
        id: 'metadata',
        file: 'src/**/*.ts',
        sessionNumber: 1,
        matcher: { kind: 'containsAll', substrings: ['correlationId', 'causationId', 'timestamp'] },
      },
    ];
    const pass = scoreStructuralAssertions(
      [makeRecord(1, {
        'src/events/types.ts': 'interface Meta { correlationId: string; causationId: string; }',
        'src/events/clock.ts': 'const timestamp = Date.now();',
      })],
      assertions,
    );
    expect(pass.score).toBe(1);

    const fail = scoreStructuralAssertions(
      [makeRecord(1, { 'src/events/types.ts': 'interface Meta { correlationId: string; }' })],
      assertions,
    );
    expect(fail.score).toBe(0);
    expect(fail.details).toContain('causationId');
  });

  it('containsAny passes when at least one substring is present', () => {
    const assertions: StructuralAssertion[] = [
      {
        id: 'a1',
        file: 'src/a.ts',
        sessionNumber: 1,
        matcher: { kind: 'containsAny', substrings: ['ReservationConfirmed', 'ReservationCancelled'] },
      },
    ];
    const score = scoreStructuralAssertions(
      [makeRecord(1, { 'src/a.ts': 'case "ReservationCancelled": return;' })],
      assertions,
    );
    expect(score.score).toBe(1);
  });

  it('notContains fails when a forbidden substring is present', () => {
    const assertions: StructuralAssertion[] = [
      {
        id: 'no-any',
        file: 'src/a.ts',
        sessionNumber: 1,
        matcher: { kind: 'notContains', substrings: [': any'] },
      },
    ];
    const fail = scoreStructuralAssertions(
      [makeRecord(1, { 'src/a.ts': 'const x: any = 1;' })],
      assertions,
    );
    expect(fail.score).toBe(0);

    const pass = scoreStructuralAssertions(
      [makeRecord(1, { 'src/a.ts': 'const x: number = 1;' })],
      assertions,
    );
    expect(pass.score).toBe(1);
  });

  it('exportsSymbol detects an exported declaration', () => {
    const assertions: StructuralAssertion[] = [
      { id: 'a1', file: 'src/store.ts', sessionNumber: 1, matcher: { kind: 'exportsSymbol', symbol: 'EventStore' } },
    ];
    const cls = scoreStructuralAssertions(
      [makeRecord(1, { 'src/store.ts': 'export class EventStore {}' })],
      assertions,
    );
    expect(cls.score).toBe(1);

    const named = scoreStructuralAssertions(
      [makeRecord(1, { 'src/store.ts': 'class EventStore {}\nexport { EventStore };' })],
      assertions,
    );
    expect(named.score).toBe(1);

    const missing = scoreStructuralAssertions(
      [makeRecord(1, { 'src/store.ts': 'class Foo {}' })],
      assertions,
    );
    expect(missing.score).toBe(0);
  });

  it('evaluates each assertion against the session it is due in, not the latest', () => {
    const assertions: StructuralAssertion[] = [
      { id: 's1', file: 'src/a.ts', sessionNumber: 1, matcher: { kind: 'matchesRegex', pattern: 'foundation' } },
      { id: 's3', file: 'src/a.ts', sessionNumber: 3, matcher: { kind: 'matchesRegex', pattern: 'metadata' } },
    ];
    const records = [
      makeRecord(1, { 'src/a.ts': 'foundation only' }),
      makeRecord(2, { 'src/a.ts': 'foundation only' }),
      makeRecord(3, { 'src/a.ts': 'foundation with metadata' }),
    ];
    const score = scoreStructuralAssertions(records, assertions);
    expect(score.score).toBe(1); // both pass in their respective due sessions
  });

  it('fails an assertion whose due session has no record', () => {
    const assertions: StructuralAssertion[] = [
      { id: 'a5', file: 'src/a.ts', sessionNumber: 5, matcher: { kind: 'fileExists' } },
    ];
    const records = [makeRecord(1, { 'src/a.ts': 'x' })];
    const score = scoreStructuralAssertions(records, assertions);
    expect(score.score).toBe(0);
    expect(score.details).toContain('a5');
  });

  it('matches nested paths with ** glob', () => {
    const assertions: StructuralAssertion[] = [
      { id: 'a1', file: 'src/**/handlers.ts', sessionNumber: 1, matcher: { kind: 'fileExists' } },
    ];
    const score = scoreStructuralAssertions(
      [makeRecord(1, { 'src/commands/handlers.ts': 'x' })],
      assertions,
    );
    expect(score.score).toBe(1);
  });

  it('aggregate score is the fraction of assertions that pass', () => {
    const assertions: StructuralAssertion[] = [
      { id: 'p', file: 'src/a.ts', sessionNumber: 1, matcher: { kind: 'fileExists' } },
      { id: 'f', file: 'src/missing.ts', sessionNumber: 1, matcher: { kind: 'fileExists' } },
    ];
    const score = scoreStructuralAssertions(
      [makeRecord(1, { 'src/a.ts': 'x' })],
      assertions,
    );
    expect(score.score).toBe(0.5);
  });
});

describe('scoreStructuralAssertionsTimeline', () => {
  it('returns empty array when no assertions defined', () => {
    expect(scoreStructuralAssertionsTimeline([makeRecord(1)], [])).toEqual([]);
  });

  it('produces a per-session score equal to the fraction of assertions due that session', () => {
    const assertions: StructuralAssertion[] = [
      { id: 's1a', file: 'src/a.ts', sessionNumber: 1, matcher: { kind: 'fileExists' } },
      { id: 's1b', file: 'src/b.ts', sessionNumber: 1, matcher: { kind: 'fileExists' } },
      { id: 's2', file: 'src/c.ts', sessionNumber: 2, matcher: { kind: 'fileExists' } },
    ];
    const records = [
      makeRecord(1, { 'src/a.ts': 'x' }), // s1a passes, s1b fails -> 0.5
      makeRecord(2, { 'src/c.ts': 'x' }), // s2 passes -> 1
    ];
    const timeline = scoreStructuralAssertionsTimeline(records, assertions);
    expect(timeline).toHaveLength(2);
    expect(timeline[0].score).toBe(0.5);
    expect(timeline[0].details).toContain('session 1');
    expect(timeline[1].score).toBe(1);
  });

  it('omits sessions that have no assertions due', () => {
    const assertions: StructuralAssertion[] = [
      { id: 's2', file: 'src/c.ts', sessionNumber: 2, matcher: { kind: 'fileExists' } },
    ];
    const records = [makeRecord(1, {}), makeRecord(2, { 'src/c.ts': 'x' })];
    const timeline = scoreStructuralAssertionsTimeline(records, assertions);
    expect(timeline).toHaveLength(1);
    expect(timeline[0].details).toContain('session 2');
  });
});
