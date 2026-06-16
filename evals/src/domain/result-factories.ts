/**
 * Factories that build scoring results, composing the shared domain behavior:
 * required-field validation, tamper-provenance merging, and createdAt stamping
 * via an injectable clock. The shapes themselves live in `result.ts`.
 */
import type { SessionRecord } from './session.js';
import type { TamperEvent } from './tamper.js';
import type { ComparisonResult, DimensionScore, PerSessionScore, TestResult } from './result.js';
import type { Clock } from './clock.js';
import { systemClock } from './clock.js';
import { mergeTamperProvenance } from './tamper-provenance.js';
import { requireField } from './validation.js';

export function createComparisonResult(
  params: {
    id: string;
    scenarioId: string;
    harness: string;
    jumboResult: TestResult;
    baselineResult: TestResult;
    jumboScores: readonly DimensionScore[];
    baselineScores: readonly DimensionScore[];
    deltas: readonly DimensionScore[];
    jumboTimeline?: readonly PerSessionScore[];
    baselineTimeline?: readonly PerSessionScore[];
    tampered?: boolean;
    tamperLog?: readonly TamperEvent[];
  },
  clock: Clock = systemClock,
): ComparisonResult {
  requireField(params.id, 'ComparisonResult requires an id');
  requireField(params.jumboResult, 'ComparisonResult requires a jumboResult');
  requireField(params.baselineResult, 'ComparisonResult requires a baselineResult');

  const { tampered, tamperLog } = mergeTamperProvenance(
    { tampered: params.tampered, tamperLog: params.tamperLog },
    [params.jumboResult, params.baselineResult],
  );

  return {
    ...params,
    createdAt: clock(),
    tampered,
    tamperLog,
  };
}

export function createTestResult(
  params: {
    id: string;
    scenarioId: string;
    harness: string;
    sessionRecords: readonly SessionRecord[];
    tampered?: boolean;
    tamperLog?: readonly TamperEvent[];
  },
  clock: Clock = systemClock,
): TestResult {
  requireField(params.id, 'TestResult requires an id');
  requireField(params.scenarioId, 'TestResult requires a scenarioId');
  requireField(params.harness, 'TestResult requires a harness');

  const { tampered, tamperLog } = mergeTamperProvenance(
    { tampered: params.tampered, tamperLog: params.tamperLog },
    params.sessionRecords,
  );

  return {
    ...params,
    createdAt: clock(),
    tampered,
    tamperLog,
  };
}
