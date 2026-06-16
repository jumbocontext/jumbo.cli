import { describe, it, expect } from '@jest/globals';
import { summarizeJumboEvents } from '../../src/infrastructure/local-executor.js';

const TS = '2026-03-21T10:05:00Z';

describe('summarizeJumboEvents', () => {
  it('returns an empty summary for no event files', () => {
    const summary = summarizeJumboEvents([], TS);
    expect(summary.capturedAt).toBe(TS);
    expect(summary.aggregateCount).toBe(0);
    expect(summary.eventCount).toBe(0);
    expect(summary.countsByType).toEqual({});
    expect(summary.fileNames).toEqual([]);
  });

  it('counts events and aggregates from a typical layout', () => {
    const paths = [
      'project/000001.ProjectInitializedEvent.json',
      'cd3a2dc3-e242-4165-ad51-5587fd3adc11/000001.DecisionAddedEvent.json',
      'd2f936e3-25f7-4784-81d2-65f1da30be07/000001.ComponentAddedEvent.json',
      'c3cb11f3-754e-4346-800f-11c64d9b143b/000001.WorkerIdentifiedEvent.json',
    ];
    const summary = summarizeJumboEvents(paths, TS);
    expect(summary.eventCount).toBe(4);
    expect(summary.aggregateCount).toBe(4);
    expect(summary.countsByType).toEqual({
      ProjectInitializedEvent: 1,
      DecisionAddedEvent: 1,
      ComponentAddedEvent: 1,
      WorkerIdentifiedEvent: 1,
    });
  });

  it('aggregates type counts across multiple events of the same type', () => {
    const paths = [
      'a/000001.DecisionAddedEvent.json',
      'b/000001.DecisionAddedEvent.json',
      'a/000002.DecisionAddedEvent.json',
    ];
    const summary = summarizeJumboEvents(paths, TS);
    expect(summary.countsByType.DecisionAddedEvent).toBe(3);
    expect(summary.eventCount).toBe(3);
    expect(summary.aggregateCount).toBe(2); // a and b
  });

  it('parses the event type by stripping the sequence prefix and .json suffix', () => {
    const summary = summarizeJumboEvents(['agg/000007.InvariantAddedEvent.json'], TS);
    expect(summary.countsByType).toEqual({ InvariantAddedEvent: 1 });
  });

  it('buckets unparseable filenames under "unknown"', () => {
    const summary = summarizeJumboEvents(['agg/snapshot.bin', 'agg/000001.DecisionAddedEvent.json'], TS);
    expect(summary.countsByType.unknown).toBe(1);
    expect(summary.countsByType.DecisionAddedEvent).toBe(1);
  });

  it('returns fileNames sorted for deterministic evidence', () => {
    const paths = [
      'z/000001.DecisionAddedEvent.json',
      'a/000001.ComponentAddedEvent.json',
      'm/000001.InvariantAddedEvent.json',
    ];
    const summary = summarizeJumboEvents(paths, TS);
    expect(summary.fileNames).toEqual([
      'a/000001.ComponentAddedEvent.json',
      'm/000001.InvariantAddedEvent.json',
      'z/000001.DecisionAddedEvent.json',
    ]);
  });
});
