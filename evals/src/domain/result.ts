/**
 * Scoring output shapes: per-dimension scores, a single-arm test result, and
 * the side-by-side comparison of the Jumbo and baseline arms. Shape only — the
 * behavior that builds these (clock, tamper-provenance, validation) lives in
 * `result-factories.ts` and the small helpers it composes.
 */

import type { SessionRecord } from './session.js';
import type { TamperEvent } from './tamper.js';

export interface TestResult {
  readonly id: string;
  readonly scenarioId: string;
  readonly harness: string;
  readonly sessionRecords: readonly SessionRecord[];
  readonly createdAt: string;
  readonly tampered: boolean;
  readonly tamperLog: readonly TamperEvent[];
}

export interface DimensionScore {
  readonly dimension: string;
  readonly score: number;
  readonly maxScore: number;
  readonly details?: string;
}

export interface PerSessionScore {
  readonly sessionNumber: number;
  readonly scores: readonly DimensionScore[];
}

export interface ComparisonResult {
  readonly id: string;
  readonly scenarioId: string;
  readonly harness: string;
  readonly jumboResult: TestResult;
  readonly baselineResult: TestResult;
  readonly jumboScores: readonly DimensionScore[];
  readonly baselineScores: readonly DimensionScore[];
  readonly deltas: readonly DimensionScore[];
  readonly jumboTimeline?: readonly PerSessionScore[];
  readonly baselineTimeline?: readonly PerSessionScore[];
  readonly createdAt: string;
  readonly tampered: boolean;
  readonly tamperLog: readonly TamperEvent[];
}
