/**
 * WorkSummaryView - Aggregated view of current work status
 *
 * Contains session and goal information for the variable content
 * section of the CLI display (below the banner).
 *
 * This view aggregates data from multiple projections:
 * - Active session status
 * - Goal counts by status
 * - Blocked goals requiring attention
 */
export interface WorkSummaryView {
  /**
   * Active session information (null if no active session)
   */
  readonly session: {
    readonly sessionId: string;
    readonly focus: string | null;
    readonly status: "active" | "paused" | "blocked" | "ended";
    readonly startedAt: string;
  } | null;

  /**
   * Goal counts by status
   */
  readonly goals: {
    readonly planned: number;
    readonly active: number;
    readonly blocked: number;
    readonly completed: number;
  };

  /**
   * Blocked goals requiring attention
   */
  readonly blockers: ReadonlyArray<{
    readonly goalId: string;
    readonly objective: string;
    readonly note: string;
  }>;
}
