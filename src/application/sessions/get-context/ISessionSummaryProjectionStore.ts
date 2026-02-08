import {
  SessionSummaryProjection,
  GoalReference,
  BlockerReference,
  DecisionReference,
  GoalStartedReference,
  GoalPausedReference,
  GoalResumedReference,
} from "../SessionSummaryView.js";

/**
 * ISessionSummaryProjectionStore - Port for SessionSummary read model persistence
 *
 * Manages the SessionSummary projection using the "LATEST" pattern for O(1) lookups.
 *
 * The "LATEST" Pattern:
 * - Most recent session summary always stored with sessionId='LATEST'
 * - When a session ends and new one starts, LATEST is archived to its original ID
 * - Enables O(1) point-read: SELECT * FROM session_summary_views WHERE session_id='LATEST'
 * - 10-100x faster than: SELECT * WHERE status='ended' ORDER BY updated_at DESC LIMIT 1
 */
export interface ISessionSummaryProjectionStore {
  /**
   * Create or overwrite the 'LATEST' SessionSummary
   *
   * Archives existing LATEST if status='ended' before overwriting.
   * Used when SessionStarted event fires to seed new session summary.
   *
   * @param summary - The session summary to store as LATEST
   */
  upsertLatest(summary: SessionSummaryProjection): Promise<void>;

  /**
   * Update SessionSummary properties (status, etc.)
   *
   * Defaults to updating 'LATEST', but can target specific sessionId.
   *
   * @param sessionId - Session ID to update (defaults to 'LATEST')
   * @param updates - Partial updates to apply
   */
  update(
    sessionId: string,
    updates: Partial<SessionSummaryProjection>
  ): Promise<void>;

  /**
   * Append a completed goal to LATEST
   *
   * Called when GoalCompletedEvent event fires.
   *
   * @param goalReference - Reference to completed goal
   */
  addCompletedGoal(goalReference: GoalReference): Promise<void>;

  /**
   * Append a blocker to LATEST
   *
   * Called when GoalBlockedEvent event fires.
   *
   * @param blocker - Reference to blocked goal with reason
   */
  addBlocker(blocker: BlockerReference): Promise<void>;

  /**
   * Append a decision to LATEST
   *
   * Called when DecisionAdded event fires.
   *
   * @param decision - Reference to decision with title and rationale
   */
  addDecision(decision: DecisionReference): Promise<void>;

  /**
   * Append a started goal to LATEST
   *
   * Called when GoalStartedEvent event fires.
   *
   * @param goalReference - Reference to started goal
   */
  addStartedGoal(goalReference: GoalStartedReference): Promise<void>;

  /**
   * Append a paused goal to LATEST
   *
   * Called when GoalPausedEvent event fires.
   *
   * @param goalReference - Reference to paused goal
   */
  addPausedGoal(goalReference: GoalPausedReference): Promise<void>;

  /**
   * Append a resumed goal to LATEST
   *
   * Called when GoalResumedEvent event fires.
   *
   * @param goalReference - Reference to resumed goal
   */
  addResumedGoal(goalReference: GoalResumedReference): Promise<void>;

  /**
   * Get the LATEST session summary (point-read, O(1) performance)
   *
   * Uses primary key lookup for maximum performance.
   * Returns null only if no session has ever been created.
   *
   * @returns LATEST session summary, or null if none exists
   */
  findLatest(): Promise<SessionSummaryProjection | null>;

  /**
   * Get specific historical session summary by original ID
   *
   * Used to query archived session summaries.
   *
   * @param originalSessionId - The original session UUID
   * @returns Session summary, or null if not found
   */
  findByOriginalId(
    originalSessionId: string
  ): Promise<SessionSummaryProjection | null>;

  /**
   * Archive the current LATEST by cloning it with its original ID
   *
   * Called when starting a new session if LATEST exists and status='ended'.
   * Preserves historical session summaries.
   */
  archiveLatest(): Promise<void>;
}
