import { IEventBus } from "../../../messaging/IEventBus.js";
import { ISessionSummaryProjectionStore } from "./ISessionSummaryProjectionStore.js";
import { IGoalReadForSessionSummary } from "./IGoalReadForSessionSummary.js";
import { IDecisionSessionReader } from "./IDecisionSessionReader.js";
import { SessionStartedEvent } from "../../../../domain/sessions/start/SessionStartedEvent.js";
import { SessionEndedEvent } from "../../../../domain/sessions/end/SessionEndedEvent.js";
import { GoalCompletedEvent } from "../../../../domain/goals/complete/GoalCompletedEvent.js";
import { GoalBlockedEvent } from "../../../../domain/goals/block/GoalBlockedEvent.js";
import { GoalStartedEvent } from "../../../../domain/goals/start/GoalStartedEvent.js";
import { GoalPausedEvent } from "../../../../domain/goals/pause/GoalPausedEvent.js";
import { GoalResumedEvent } from "../../../../domain/goals/resume/GoalResumedEvent.js";
import { DecisionAddedEvent } from "../../../../domain/decisions/add/DecisionAddedEvent.js";
import { BaseEvent } from "../../../../domain/BaseEvent.js";

/**
 * SessionSummaryProjectionHandler - Updates SessionSummary projection
 *
 * This is a cross-aggregate projection handler (standard CQRS pattern).
 * It subscribes to events from multiple aggregates to build a comprehensive
 * session summary for orientation context.
 *
 * Subscriptions:
 * - Session events: SessionStarted, SessionEnded
 * - Goal events: GoalCompleted, GoalBlocked, GoalStarted, GoalPaused, GoalResumed
 * - Decision events: DecisionAdded
 *
 * Event Data Enrichment Pattern:
 * Events remain lean (just IDs and state changes). This handler enriches
 * event data by querying source projection stores to get additional details
 * like objective, reason, title, etc.
 *
 * The "LATEST" Pattern:
 * - All updates target the 'LATEST' session summary
 * - SessionStarted archives old LATEST (if ended) before creating new one
 * - Only updates when LATEST status='active'
 */
export class SessionSummaryProjectionHandler {
  constructor(
    private readonly eventBus: IEventBus,
    private readonly store: ISessionSummaryProjectionStore,
    private readonly goalReader: IGoalReadForSessionSummary,
    private readonly decisionReader: IDecisionSessionReader
  ) {}

  /**
   * Subscribe to all relevant events from multiple aggregates
   */
  subscribe(): void {
    // Session events
    this.eventBus.subscribe(
      "SessionStartedEvent",
      { handle: this.handleSessionStarted.bind(this) }
    );
    this.eventBus.subscribe(
      "SessionEndedEvent",
      { handle: this.handleSessionEnded.bind(this) }
    );

    // Goal events (cross-aggregate)
    this.eventBus.subscribe(
      "GoalCompletedEvent",
      { handle: this.handleGoalCompleted.bind(this) }
    );
    this.eventBus.subscribe(
      "GoalBlockedEvent",
      { handle: this.handleGoalBlocked.bind(this) }
    );
    this.eventBus.subscribe(
      "GoalStartedEvent",
      { handle: this.handleGoalStarted.bind(this) }
    );
    this.eventBus.subscribe(
      "GoalPausedEvent",
      { handle: this.handleGoalPaused.bind(this) }
    );
    this.eventBus.subscribe(
      "GoalResumedEvent",
      { handle: this.handleGoalResumed.bind(this) }
    );

    // Decision events (cross-aggregate)
    this.eventBus.subscribe(
      "DecisionAddedEvent",
      { handle: this.handleDecisionAdded.bind(this) }
    );
  }

  /**
   * SessionStarted → Archive old LATEST and create new LATEST seed
   *
   * Archival Logic:
   * - If LATEST exists and status='ended', clone it to permanent ID
   * - Create/overwrite LATEST with new session seed (empty arrays)
   */
  private async handleSessionStarted(event: BaseEvent): Promise<void> {
    const sessionStartedEvent = event as SessionStartedEvent;

    // Archive existing LATEST if it exists and is ended
    await this.store.archiveLatest();

    // Create/overwrite LATEST with new session seed
    await this.store.upsertLatest({
      sessionId: "LATEST",
      originalSessionId: sessionStartedEvent.aggregateId,
      focus: sessionStartedEvent.payload.focus,
      status: "active",
      contextSnapshot: sessionStartedEvent.payload.contextSnapshot,
      completedGoals: [],
      blockersEncountered: [],
      decisions: [],
      goalsStarted: [],
      goalsPaused: [],
      goalsResumed: [],
      createdAt: sessionStartedEvent.timestamp,
      updatedAt: sessionStartedEvent.timestamp,
    });
  }

  /**
   * SessionEnded → Mark LATEST as ended
   *
   * Clone to permanent ID happens on next SessionStarted (lazy archival)
   */
  private async handleSessionEnded(event: BaseEvent): Promise<void> {
    const sessionEndedEvent = event as SessionEndedEvent;

    await this.store.update("LATEST", {
      status: "ended",
      updatedAt: sessionEndedEvent.timestamp,
    });
  }

  /**
   * GoalCompletedEvent → Append to LATEST completedGoals
   *
   * Data Enrichment:
   * - Event only contains goalId
   * - Query goal projection store to get objective
   * - Append enriched reference to session summary
   */
  private async handleGoalCompleted(event: BaseEvent): Promise<void> {
    const goalCompletedEvent = event as GoalCompletedEvent;

    // Defensive check: Only update if LATEST exists and is active
    const latestSessionSummary = await this.store.findLatest();
    if (!latestSessionSummary || latestSessionSummary.status !== "active") {
      // No active session - skip
      return;
    }

    // Enrich event data by querying goal projection for objective
    const goal = await this.goalReader.findById(
      goalCompletedEvent.aggregateId
    );

    if (!goal) {
      // Goal not found in projection store - skip gracefully
      // This can happen if projection rebuild is in progress
      return;
    }

    // Append enriched goal reference to session summary
    await this.store.addCompletedGoal({
      goalId: goalCompletedEvent.aggregateId,
      objective: goal.objective,
      status: goal.status,
      createdAt: goal.createdAt,
    });
  }

  /**
   * GoalBlockedEvent → Append to LATEST blockersEncountered
   *
   * Data Enrichment:
   * - Event only contains goalId
   * - Query goal projection store to get block reason
   * - Append enriched reference to session summary
   */
  private async handleGoalBlocked(event: BaseEvent): Promise<void> {
    const goalBlockedEvent = event as GoalBlockedEvent;

    // Defensive check: Only update if LATEST exists and is active
    const latestSessionSummary = await this.store.findLatest();
    if (!latestSessionSummary || latestSessionSummary.status !== "active") {
      // No active session - skip
      return;
    }

    // Enrich event data by querying goal projection for reason
    const goal = await this.goalReader.findById(
      goalBlockedEvent.aggregateId
    );

    if (!goal) {
      // Goal not found - skip gracefully
      return;
    }

    // Append enriched blocker reference to session summary
    await this.store.addBlocker({
      goalId: goalBlockedEvent.aggregateId,
      reason: goal.note || "Unknown reason",
    });
  }

  /**
   * DecisionAdded → Append to LATEST decisions
   *
   * Data Enrichment:
   * - Event contains all necessary data in payload
   * - Extract title and rationale from event
   * - Append to session summary
   */
  private async handleDecisionAdded(event: BaseEvent): Promise<void> {
    const decisionAddedEvent = event as DecisionAddedEvent;

    // Defensive check: Only update if LATEST exists and is active
    const latestSessionSummary = await this.store.findLatest();
    if (!latestSessionSummary || latestSessionSummary.status !== "active") {
      // No active session - skip
      return;
    }

    // Enrich event data by querying decision projection
    const decision = await this.decisionReader.findById(
      decisionAddedEvent.aggregateId
    );

    if (!decision) {
      // Decision not found - skip gracefully
      return;
    }

    // Append enriched decision reference to session summary
    await this.store.addDecision({
      decisionId: decisionAddedEvent.aggregateId,
      title: decision.title,
      rationale: decision.rationale || "",
    });
  }

  /**
   * GoalStartedEvent → Append to LATEST goalsStarted
   *
   * Data Enrichment:
   * - Event only contains goalId
   * - Query goal projection store to get objective
   * - Append enriched reference to session summary
   */
  private async handleGoalStarted(event: BaseEvent): Promise<void> {
    const goalStartedEvent = event as GoalStartedEvent;

    // Defensive check: Only update if LATEST exists and is active
    const latestSessionSummary = await this.store.findLatest();
    if (!latestSessionSummary || latestSessionSummary.status !== "active") {
      // No active session - skip
      return;
    }

    // Enrich event data by querying goal projection for objective
    const goal = await this.goalReader.findById(goalStartedEvent.aggregateId);

    if (!goal) {
      // Goal not found in projection store - skip gracefully
      return;
    }

    // Append enriched goal reference to session summary
    await this.store.addStartedGoal({
      goalId: goalStartedEvent.aggregateId,
      objective: goal.objective,
      startedAt: goalStartedEvent.timestamp,
    });
  }

  /**
   * GoalPausedEvent → Append to LATEST goalsPaused
   *
   * Data Enrichment:
   * - Event contains reason and optional note in payload
   * - Query goal projection store to get objective
   * - Append enriched reference to session summary
   */
  private async handleGoalPaused(event: BaseEvent): Promise<void> {
    const goalPausedEvent = event as GoalPausedEvent;

    // Defensive check: Only update if LATEST exists and is active
    const latestSessionSummary = await this.store.findLatest();
    if (!latestSessionSummary || latestSessionSummary.status !== "active") {
      // No active session - skip
      return;
    }

    // Enrich event data by querying goal projection for objective
    const goal = await this.goalReader.findById(goalPausedEvent.aggregateId);

    if (!goal) {
      // Goal not found - skip gracefully
      return;
    }

    // Append enriched paused goal reference to session summary
    await this.store.addPausedGoal({
      goalId: goalPausedEvent.aggregateId,
      objective: goal.objective,
      reason: goalPausedEvent.payload.reason,
      note: goalPausedEvent.payload.note,
      pausedAt: goalPausedEvent.timestamp,
    });
  }

  /**
   * GoalResumedEvent → Append to LATEST goalsResumed
   *
   * Data Enrichment:
   * - Event contains optional note in payload
   * - Query goal projection store to get objective
   * - Append enriched reference to session summary
   */
  private async handleGoalResumed(event: BaseEvent): Promise<void> {
    const goalResumedEvent = event as GoalResumedEvent;

    // Defensive check: Only update if LATEST exists and is active
    const latestSessionSummary = await this.store.findLatest();
    if (!latestSessionSummary || latestSessionSummary.status !== "active") {
      // No active session - skip
      return;
    }

    // Enrich event data by querying goal projection for objective
    const goal = await this.goalReader.findById(goalResumedEvent.aggregateId);

    if (!goal) {
      // Goal not found - skip gracefully
      return;
    }

    // Append enriched resumed goal reference to session summary
    await this.store.addResumedGoal({
      goalId: goalResumedEvent.aggregateId,
      objective: goal.objective,
      note: goalResumedEvent.payload.note,
      resumedAt: goalResumedEvent.timestamp,
    });
  }
}
