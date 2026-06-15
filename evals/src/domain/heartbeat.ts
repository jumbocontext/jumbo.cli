/**
 * Live progress heartbeats written during a run so an external watcher can
 * render per-session status without inspecting the agent process directly.
 */

import type { SessionPhaseTimings } from './timing.js';

export type SessionHeartbeatStatus = 'pending' | 'running' | 'completed' | 'failed';
export type SessionHeartbeatPhase = 'harness-exec' | 'lifecycle-audit' | 'scoring';

export interface SessionHeartbeat {
  readonly sessionNumber: number;
  readonly status: SessionHeartbeatStatus;
  readonly phase?: SessionHeartbeatPhase;
  readonly startedAt?: string;
  readonly completedAt?: string;
  readonly phaseTimings?: SessionPhaseTimings;
  readonly errorMessage?: string;
}

export interface HarnessHeartbeat {
  readonly harness: string;
  readonly variant: 'jumbo' | 'baseline';
  readonly sessions: readonly SessionHeartbeat[];
}

export interface RunHeartbeat {
  readonly runId: string;
  readonly scenarioId: string;
  readonly updatedAt: string;
  readonly harnesses: readonly HarnessHeartbeat[];
}
