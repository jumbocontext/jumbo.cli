/**
 * Operator tamper events and the run-control file used to drive pause/resume/
 * abort/inject-context during a live run. Tampered records are quarantined from
 * aggregate scoring.
 */

export type TamperAction = 'pause' | 'resume' | 'abort' | 'inject-context';

export interface TamperEvent {
  readonly occurredAt: string;
  readonly action: TamperAction;
  readonly sessionNumber?: number;
  readonly harness?: string;
  readonly variant?: 'jumbo' | 'baseline';
  readonly payload?: string;
  readonly operator?: string;
}

export interface RunControlFile {
  readonly runId: string;
  readonly updatedAt: string;
  readonly pendingActions: readonly TamperEvent[];
  readonly pauseRequested: boolean;
  readonly abortRequested: boolean;
}
