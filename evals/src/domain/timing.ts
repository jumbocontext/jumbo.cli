/**
 * Per-phase wall-clock timings captured during a session.
 */

export interface TimingSpan {
  readonly startedAt: string;
  readonly completedAt: string;
  readonly elapsedMs: number;
}

export interface SessionPhaseTimings {
  readonly harnessExec: TimingSpan;
  readonly lifecycleAudit?: TimingSpan;
}
