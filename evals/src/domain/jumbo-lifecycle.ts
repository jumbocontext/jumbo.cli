/**
 * Post-session verification that the agent actually executed the Jumbo
 * lifecycle, derived from Jumbo's own state rather than transcript parsing.
 */

/**
 * Post-session verification that the agent actually executed the Jumbo
 * lifecycle (session start, goal start, in-session captures, progress
 * updates, goal submit, session end). Each boolean is derived from the
 * captured CLI evidence below, not from transcript parsing — the framework
 * treats Jumbo's own state as ground truth for what happened during the
 * harness exec.
 *
 * `inSessionCapturesExecuted` is true when the post-session memory snapshot
 * contains entities not present in the pre-session snapshot. `progressUpdatesExecuted`
 * is derived from the goal entity's version delta: `jumbo goal update-progress`
 * mutates the goal aggregate (bumping version) without changing status, so a
 * version delta beyond the canonical start+submit mutations indicates
 * progress entries were appended.
 */
export interface JumboLifecycleAudit {
  readonly sessionStartExecuted: boolean;
  readonly goalStartExecuted: boolean;
  readonly inSessionCapturesExecuted: boolean;
  readonly progressUpdatesExecuted: boolean;
  readonly goalSubmitExecuted: boolean;
  readonly sessionEndExecuted: boolean;
  readonly activeGoalId?: string;
  readonly goalStatusBefore?: string;
  readonly goalStatusAfter?: string;
  readonly goalVersionBefore?: number;
  readonly goalVersionAfter?: number;
  readonly sessionsTotalDelta: number;
  readonly sessionsEndedDelta: number;
  readonly newEntityCount: number;
  readonly evidence: JumboLifecycleEvidence;
}

export interface JumboLifecycleEvidence {
  readonly goalShowBefore?: JumboLifecycleCommandResult;
  readonly goalShowAfter?: JumboLifecycleCommandResult;
  readonly sessionsListBefore?: JumboLifecycleCommandResult;
  readonly sessionsListAfter?: JumboLifecycleCommandResult;
  readonly sessionsEndedListAfter?: JumboLifecycleCommandResult;
  readonly decisionsListAfter?: JumboLifecycleCommandResult;
}

export interface JumboLifecycleCommandResult {
  readonly command: readonly string[];
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: number;
}
