import { describe, it, expect } from '@jest/globals';
import { mergeTamperProvenance } from '../../src/domain/tamper-provenance.js';
import { createTestResult, createComparisonResult } from '../../src/domain/index.js';
import type { SessionRecord, TamperEvent } from '../../src/domain/index.js';

function event(action: TamperEvent['action'], operator: string): TamperEvent {
  return { occurredAt: '2026-03-21T10:00:00Z', action, operator };
}

describe('mergeTamperProvenance', () => {
  it('is untampered with empty seed and no sources', () => {
    const p = mergeTamperProvenance({}, []);
    expect(p.tampered).toBe(false);
    expect(p.tamperLog).toEqual([]);
  });

  it('is tampered when the seed says so', () => {
    const p = mergeTamperProvenance({ tampered: true, tamperLog: [event('pause', 'op')] }, []);
    expect(p.tampered).toBe(true);
    expect(p.tamperLog).toHaveLength(1);
  });

  it('is tampered when any source is tampered', () => {
    const p = mergeTamperProvenance({}, [
      { tampered: false, tamperLog: [] },
      { tampered: true, tamperLog: [event('abort', 'op')] },
    ]);
    expect(p.tampered).toBe(true);
  });

  it('concatenates seed log then each source log in order', () => {
    const p = mergeTamperProvenance({ tamperLog: [event('pause', 'seed')] }, [
      { tampered: true, tamperLog: [event('resume', 'a')] },
      { tampered: false, tamperLog: [event('inject-context', 'b')] },
    ]);
    expect(p.tamperLog.map((e) => e.operator)).toEqual(['seed', 'a', 'b']);
  });
});

describe('result factories with an injectable clock', () => {
  const fixedClock = () => '2000-01-01T00:00:00Z';

  it('createTestResult stamps createdAt from the provided clock', () => {
    const result = createTestResult(
      { id: 'r1', scenarioId: 's1', harness: 'claude-code', sessionRecords: [] },
      fixedClock,
    );
    expect(result.createdAt).toBe('2000-01-01T00:00:00Z');
    expect(result.tampered).toBe(false);
  });

  it('createTestResult folds session tamper provenance into the result', () => {
    const tamperedSession = {
      tampered: true,
      tamperLog: [event('abort', 'op')],
    } as unknown as SessionRecord;
    const result = createTestResult(
      { id: 'r1', scenarioId: 's1', harness: 'claude-code', sessionRecords: [tamperedSession] },
      fixedClock,
    );
    expect(result.tampered).toBe(true);
    expect(result.tamperLog).toHaveLength(1);
  });

  it('createComparisonResult stamps createdAt from the provided clock', () => {
    const arm = createTestResult(
      { id: 'a', scenarioId: 's1', harness: 'claude-code', sessionRecords: [] },
      fixedClock,
    );
    const cmp = createComparisonResult(
      {
        id: 'c1',
        scenarioId: 's1',
        harness: 'claude-code',
        jumboResult: arm,
        baselineResult: arm,
        jumboScores: [],
        baselineScores: [],
        deltas: [],
      },
      fixedClock,
    );
    expect(cmp.createdAt).toBe('2000-01-01T00:00:00Z');
  });
});
