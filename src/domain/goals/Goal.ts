import { BaseAggregate, AggregateState } from "../BaseAggregate.js";
import { UUID } from "../BaseEvent.js";
import { ValidationRuleSet } from "../validation/ValidationRule.js";
import { GoalEvent, GoalAddedEvent, GoalRefinedEvent, GoalStartedEvent, GoalUpdatedEvent, GoalBlockedEvent, GoalUnblockedEvent, GoalCompletedEvent, GoalResetEvent, GoalRemovedEvent, GoalPausedEvent, GoalResumedEvent, GoalProgressUpdatedEvent, GoalSubmittedForReviewEvent, GoalQualifiedEvent } from "./EventIndex.js";
import { GoalEventType, GoalStatus, GoalStatusType } from "./Constants.js";
import { GoalPausedReasonsType } from "./GoalPausedReasons.js";
import { OBJECTIVE_RULES } from "./rules/ObjectiveRules.js";
import { TITLE_RULES } from "./rules/TitleRules.js";
import { SUCCESS_CRITERIA_RULES } from "./rules/SuccessCriteriaRules.js";
import { SCOPE_RULES } from "./rules/ScopeRules.js";
import { UPDATE_RULES } from "./rules/UpdateRules.js";
import { NOTE_RULES, OPTIONAL_NOTE_RULES } from "./rules/NoteRules.js";
import {
  CanAddRule,
  CanRefineRule,
  CanStartRule,
  CanUpdateRule,
  CanCompleteRule,
  CanResetRule,
  CanBlockRule,
  CanUnblockRule,
  CanPauseRule,
  CanResumeRule,
} from "./rules/StateTransitionRules.js";
import { CanSubmitForReviewRule } from "./rules/CanSubmitForReviewRule.js";
import { CanQualifyRule } from "./rules/CanQualifyRule.js";

// Domain state: business properties + aggregate metadata
export interface GoalState extends AggregateState {
  id: UUID;
  title: string;
  objective: string;
  successCriteria: string[];
  scopeIn: string[];
  scopeOut: string[];
  status: GoalStatusType;
  version: number;
  note?: string;  // Optional: populated when blocked or completed
  progress: string[];  // Tracks completed sub-tasks (append-only)
  nextGoalId?: UUID;
  prerequisiteGoals?: UUID[];
}

export class Goal extends BaseAggregate<GoalState, GoalEvent> {
  private constructor(state: GoalState) {
    super(state);
  }

  /**
   * Applies a single event to mutate state in place.
   * Called by BaseAggregate.makeEvent() and during rehydration.
   */
  static apply(state: GoalState, event: GoalEvent): void {
    switch (event.type) {
      case GoalEventType.ADDED: {
        const e = event as GoalAddedEvent;
        state.title = e.payload.title;
        state.objective = e.payload.objective;
        state.successCriteria = e.payload.successCriteria;
        state.scopeIn = e.payload.scopeIn;
        state.scopeOut = e.payload.scopeOut;
        state.status = e.payload.status;
        if (e.payload.nextGoalId !== undefined) {
          state.nextGoalId = e.payload.nextGoalId;
        }
        if (e.payload.prerequisiteGoals !== undefined) {
          state.prerequisiteGoals = e.payload.prerequisiteGoals;
        }
        state.version = e.version;
        break;
      }

      case GoalEventType.REFINED: {
        const e = event as GoalRefinedEvent;
        state.status = e.payload.status;  // "refined"
        state.version = e.version;
        break;
      }

      case GoalEventType.STARTED: {
        const e = event as GoalStartedEvent;
        state.status = e.payload.status;  // "doing"
        state.version = e.version;
        break;
      }

      case GoalEventType.UPDATED: {
        const e = event as GoalUpdatedEvent;
        // Only update provided fields (partial update pattern)
        if (e.payload.title !== undefined) {
          state.title = e.payload.title;
        }
        if (e.payload.objective !== undefined) {
          state.objective = e.payload.objective;
        }
        if (e.payload.successCriteria !== undefined) {
          state.successCriteria = e.payload.successCriteria;
        }
        if (e.payload.scopeIn !== undefined) {
          state.scopeIn = e.payload.scopeIn;
        }
        if (e.payload.scopeOut !== undefined) {
          state.scopeOut = e.payload.scopeOut;
        }
        if (e.payload.nextGoalId !== undefined) {
          state.nextGoalId = e.payload.nextGoalId;
        }
        if (e.payload.prerequisiteGoals !== undefined) {
          state.prerequisiteGoals = e.payload.prerequisiteGoals;
        }
        state.version = e.version;
        break;
      }

      case GoalEventType.BLOCKED: {
        const e = event as GoalBlockedEvent;
        state.status = e.payload.status;  // 'blocked'
        state.note = e.payload.note;       // Reason for blocking
        state.version = e.version;
        break;
      }

      case GoalEventType.UNBLOCKED: {
        const e = event as GoalUnblockedEvent;
        state.status = e.payload.status;  // 'doing'
        state.note = e.payload.note;       // Optional resolution note
        state.version = e.version;
        break;
      }

      case GoalEventType.PAUSED: {
        const e = event as GoalPausedEvent;
        state.status = e.payload.status;  // 'paused'
        state.note = e.payload.note;       // Optional note about pausing
        state.version = e.version;
        break;
      }

      case GoalEventType.RESUMED: {
        const e = event as GoalResumedEvent;
        state.status = e.payload.status;  // 'doing'
        state.note = e.payload.note;       // Optional note about resuming
        state.version = e.version;
        break;
      }

      case GoalEventType.COMPLETED: {
        const e = event as GoalCompletedEvent;
        state.status = e.payload.status;  // 'completed'
        state.version = e.version;
        break;
      }

      case GoalEventType.RESET: {
        const e = event as GoalResetEvent;
        state.status = e.payload.status;  // 'to-do'
        state.note = undefined;            // Clear any notes from previous states
        state.version = e.version;
        break;
      }

      case GoalEventType.PROGRESS_UPDATED: {
        const e = event as GoalProgressUpdatedEvent;
        // Append task description to progress array (append-only)
        state.progress.push(e.payload.taskDescription);
        state.version = e.version;
        break;
      }

      case GoalEventType.SUBMITTED_FOR_REVIEW: {
        const e = event as GoalSubmittedForReviewEvent;
        state.status = e.payload.status;  // 'in-review'
        state.version = e.version;
        break;
      }

      case GoalEventType.QUALIFIED: {
        const e = event as GoalQualifiedEvent;
        state.status = e.payload.status;  // 'qualified'
        state.version = e.version;
        break;
      }

      case GoalEventType.REMOVED: {
        const e = event as GoalRemovedEvent;
        // Goal is removed - projection handles this via row deletion
        state.version = e.version;
        break;
      }
    }
  }

  static create(id: UUID): Goal {
    const state: GoalState = {
      id,
      title: "",
      objective: "",
      successCriteria: [],
      scopeIn: [],
      scopeOut: [],
      status: GoalStatus.TODO,
      version: 0,
      progress: [],
    };
    return new Goal(state);
  }

  /**
   * Rehydrates aggregate state from full event history.
   * Used to rebuild Goal from event store.
   */
  static rehydrate(id: UUID, history: GoalEvent[]): Goal {
    const state: GoalState = {
      id,
      title: "",
      objective: "",
      successCriteria: [],
      scopeIn: [],
      scopeOut: [],
      status: GoalStatus.TODO,
      version: 0,
      progress: [],
    };

    for (const event of history) {
      Goal.apply(state, event);
    }

    return new Goal(state);
  }

  add(
    title: string,
    objective: string,
    successCriteria: string[],
    scopeIn?: string[],
    scopeOut?: string[],
    nextGoalId?: UUID,
    prerequisiteGoals?: UUID[]
  ): GoalAddedEvent {
    // State validation: goal can only be defined once (version must be 0)
    ValidationRuleSet.ensure(this.state, [new CanAddRule()]);

    // Input validation using rules
    ValidationRuleSet.ensure(title, TITLE_RULES);
    ValidationRuleSet.ensure(objective, OBJECTIVE_RULES);
    ValidationRuleSet.ensure(successCriteria, SUCCESS_CRITERIA_RULES);
    if (scopeIn) ValidationRuleSet.ensure(scopeIn, SCOPE_RULES);
    if (scopeOut) ValidationRuleSet.ensure(scopeOut, SCOPE_RULES);

    // Create and return event using BaseAggregate.makeEvent
    return this.makeEvent(
      GoalEventType.ADDED,
      {
        title,
        objective,
        successCriteria,
        scopeIn: scopeIn || [],
        scopeOut: scopeOut || [],
        status: GoalStatus.TODO,
        ...(nextGoalId && { nextGoalId }),
        ...(prerequisiteGoals && prerequisiteGoals.length > 0 && { prerequisiteGoals }),
      },
      Goal.apply
    ) as GoalAddedEvent;
  }

  /**
   * Refines a goal after creation.
   * Transitions status from "to-do" to "refined".
   * A goal must be refined before it can be started.
   *
   * @returns GoalRefined event
   * @throws Error if goal is not in 'to-do' status
   */
  refine(): GoalRefinedEvent {
    // State validation: can only refine from to-do status
    ValidationRuleSet.ensure(this.state, [new CanRefineRule()]);

    // Create and return event using BaseAggregate.makeEvent
    return this.makeEvent(
      GoalEventType.REFINED,
      {
        status: GoalStatus.REFINED,
        refinedAt: new Date().toISOString(),
      },
      Goal.apply
    ) as GoalRefinedEvent;
  }

  /**
   * Starts a refined goal (begins work).
   * Transitions status from "refined" to "doing".
   * Goal must be refined before starting.
   *
   * @param claimInfo - Optional claim information to embed in the event
   * @returns GoalStarted event
   * @throws Error if goal is blocked, completed, or not yet refined
   */
  start(claimInfo?: {
    claimedBy: string;
    claimedAt: string;
    claimExpiresAt: string;
  }): GoalStartedEvent {
    // State validation using rules
    // Note: CanStartRule allows 'doing' status (idempotent) and 'refined' status
    ValidationRuleSet.ensure(this.state, [new CanStartRule()]);

    // Create and return event using BaseAggregate.makeEvent
    return this.makeEvent(
      GoalEventType.STARTED,
      {
        status: GoalStatus.DOING,
        // Include claim info if provided
        ...(claimInfo && {
          claimedBy: claimInfo.claimedBy,
          claimedAt: claimInfo.claimedAt,
          claimExpiresAt: claimInfo.claimExpiresAt,
        }),
      },
      Goal.apply
    ) as GoalStartedEvent;
  }

  /**
   * Updates goal properties. Only provided fields are updated.
   * @throws Error if goal is completed or no changes provided
   */
  update(
    title?: string,
    objective?: string,
    successCriteria?: string[],
    scopeIn?: string[],
    scopeOut?: string[],
    nextGoalId?: UUID,
    prerequisiteGoals?: UUID[]
  ): GoalUpdatedEvent {
    // 1. State validation using rules - cannot update completed goals
    ValidationRuleSet.ensure(this.state, [new CanUpdateRule()]);

    // 2. Check if any update is provided (including nextGoalId and prerequisiteGoals)
    const hasNextGoalIdUpdate = nextGoalId !== undefined;
    const hasPrerequisiteGoalsUpdate = prerequisiteGoals !== undefined;

    // 3. Input validation using rules (validates at least one field and validates provided fields)
    // Skip UPDATE_RULES if only nextGoalId or prerequisiteGoals is being updated
    if (!hasNextGoalIdUpdate && !hasPrerequisiteGoalsUpdate) {
      ValidationRuleSet.ensure(
        { title, objective, successCriteria, scopeIn, scopeOut },
        UPDATE_RULES
      );
    } else if (title || objective || successCriteria || scopeIn || scopeOut) {
      // If both standard fields and chaining fields provided, validate standard fields
      ValidationRuleSet.ensure(
        { title, objective, successCriteria, scopeIn, scopeOut },
        UPDATE_RULES
      );
    }

    // 4. Create and return event
    return this.makeEvent(
      GoalEventType.UPDATED,
      {
        title,
        objective,
        successCriteria,
        scopeIn,
        scopeOut,
        ...(nextGoalId && { nextGoalId }),
        ...(prerequisiteGoals && { prerequisiteGoals }),
      },
      Goal.apply
    ) as GoalUpdatedEvent;
  }

  /**
   * Blocks a goal with a reason.
   * Transitions status from "to-do" or "doing" to "blocked".
   *
   * @param note - Reason why the goal is blocked
   * @returns GoalBlocked event
   * @throws Error if goal is already blocked or completed, or if note is invalid
   */
  block(note: string): GoalBlockedEvent {
    // 1. State validation: can only block from to-do or doing status
    ValidationRuleSet.ensure(this.state, [new CanBlockRule()]);

    // 2. Input validation: note must be provided and valid
    ValidationRuleSet.ensure(note, NOTE_RULES);

    // 3. Create and return event using BaseAggregate.makeEvent
    return this.makeEvent(
      GoalEventType.BLOCKED,
      {
        status: GoalStatus.BLOCKED,
        note,
      },
      Goal.apply
    ) as GoalBlockedEvent;
  }

  /**
   * Unblocks a goal and resumes work.
   * Transitions status from "blocked" to "doing".
   *
   * @param note - Optional resolution note explaining how the blocker was resolved
   * @returns GoalUnblocked event
   * @throws Error if goal is not blocked, or if note is invalid
   */
  unblock(note?: string): GoalUnblockedEvent {
    // 1. State validation: can only unblock from blocked status
    ValidationRuleSet.ensure(this.state, [new CanUnblockRule()]);

    // 2. Input validation: note is optional but must be valid if provided
    // Sanitize note (trim whitespace, convert empty string to undefined)
    const sanitizedNote = note && note.trim() !== '' ? note.trim() : undefined;

    if (sanitizedNote) {
      ValidationRuleSet.ensure(sanitizedNote, OPTIONAL_NOTE_RULES);
    }

    // 3. Create and return event using BaseAggregate.makeEvent
    return this.makeEvent(
      GoalEventType.UNBLOCKED,
      {
        status: GoalStatus.DOING,
        note: sanitizedNote,
      },
      Goal.apply
    ) as GoalUnblockedEvent;
  }

  /**
   * Marks the goal as completed. Goal must be in 'doing' or 'blocked' status.
   * @returns GoalCompleted event
   * @throws Error if goal is not yet started or already completed
   */
  complete(): GoalCompletedEvent {
    // State validation using rules
    ValidationRuleSet.ensure(this.state, [new CanCompleteRule()]);

    // Create and return event
    return this.makeEvent(
      GoalEventType.COMPLETED,
      {
        status: GoalStatus.COMPLETED
      },
      Goal.apply
    ) as GoalCompletedEvent;
  }

  /**
   * Resets a goal back to 'to-do' status.
   * Can transition from 'doing' or 'completed' status back to 'to-do'.
   * Blocked goals cannot be reset to preserve blocker context.
   * @returns GoalReset event
   * @throws Error if goal is blocked or already in 'to-do' status
   */
  reset(): GoalResetEvent {
    // State validation using rules
    ValidationRuleSet.ensure(this.state, [new CanResetRule()]);

    // Create and return event
    return this.makeEvent(
      GoalEventType.RESET,
      {
        status: GoalStatus.TODO
      },
      Goal.apply
    ) as GoalResetEvent;
  }

  /**
   * Removes the goal from tracking.
   * The goal's history remains in the event store but will not appear in active queries.
   * @returns GoalRemoved event
   */
  remove(): GoalRemovedEvent {
    // No state validation needed - goals can be removed in any status

    // Create and return event
    return this.makeEvent(
      GoalEventType.REMOVED,
      {
        removedAt: new Date().toISOString()
      },
      Goal.apply
    ) as GoalRemovedEvent;
  }

  /**
   * Pauses a goal.
   * Transitions status from "doing" to "paused".
   *
   * @param reason - Reason why the goal is being paused
   * @param note - Optional additional context about the pause
   * @returns GoalPaused event
   * @throws Error if goal is not in 'doing' status, or if note is invalid
   */
  pause(reason: GoalPausedReasonsType, note?: string): GoalPausedEvent {
    // 1. State validation: can only pause from doing status
    ValidationRuleSet.ensure(this.state, [new CanPauseRule()]);

    // 2. Input validation: note is optional but must be valid if provided
    // Sanitize note (trim whitespace, convert empty string to undefined)
    const sanitizedNote = note && note.trim() !== '' ? note.trim() : undefined;

    if (sanitizedNote) {
      ValidationRuleSet.ensure(sanitizedNote, OPTIONAL_NOTE_RULES);
    }

    // 3. Create and return event using BaseAggregate.makeEvent
    return this.makeEvent(
      GoalEventType.PAUSED,
      {
        status: GoalStatus.PAUSED,
        reason,
        note: sanitizedNote,
      },
      Goal.apply
    ) as GoalPausedEvent;
  }

  /**
   * Resumes a paused goal.
   * Transitions status from "paused" to "doing".
   *
   * @param note - Optional note explaining the resumption
   * @param claimInfo - Optional claim information to embed in the event
   * @returns GoalResumed event
   * @throws Error if goal is not paused, or if note is invalid
   */
  resume(
    note?: string,
    claimInfo?: {
      claimedBy: string;
      claimedAt: string;
      claimExpiresAt: string;
    }
  ): GoalResumedEvent {
    // 1. State validation: can only resume from paused status
    ValidationRuleSet.ensure(this.state, [new CanResumeRule()]);

    // 2. Input validation: note is optional but must be valid if provided
    // Sanitize note (trim whitespace, convert empty string to undefined)
    const sanitizedNote = note && note.trim() !== '' ? note.trim() : undefined;

    if (sanitizedNote) {
      ValidationRuleSet.ensure(sanitizedNote, OPTIONAL_NOTE_RULES);
    }

    // 3. Create and return event using BaseAggregate.makeEvent
    return this.makeEvent(
      GoalEventType.RESUMED,
      {
        status: GoalStatus.DOING,
        note: sanitizedNote,
        // Include claim info if provided
        ...(claimInfo && {
          claimedBy: claimInfo.claimedBy,
          claimedAt: claimInfo.claimedAt,
          claimExpiresAt: claimInfo.claimExpiresAt,
        }),
      },
      Goal.apply
    ) as GoalResumedEvent;
  }

  /**
   * Submits a goal for QA review.
   * Transitions status from "doing" or "blocked" to "in-review".
   * Marks the point where implementation is considered complete and awaiting validation.
   *
   * @returns GoalSubmittedForReview event
   * @throws Error if goal is not in 'doing' or 'blocked' status
   */
  submitForReview(): GoalSubmittedForReviewEvent {
    // 1. State validation: can only submit for review from doing or blocked status
    ValidationRuleSet.ensure(this.state, [new CanSubmitForReviewRule()]);

    // 2. Create and return event using BaseAggregate.makeEvent
    return this.makeEvent(
      GoalEventType.SUBMITTED_FOR_REVIEW,
      {
        status: GoalStatus.INREVIEW,
        submittedAt: new Date().toISOString(),
      },
      Goal.apply
    ) as GoalSubmittedForReviewEvent;
  }

  /**
   * Qualifies a goal after successful QA review.
   * Transitions status from "in-review" to "qualified".
   * Marks the point where a goal has been validated and can proceed to completion.
   *
   * @returns GoalQualified event
   * @throws Error if goal is not in 'in-review' status
   */
  qualify(): GoalQualifiedEvent {
    // 1. State validation: can only qualify from in-review status
    ValidationRuleSet.ensure(this.state, [new CanQualifyRule()]);

    // 2. Create and return event using BaseAggregate.makeEvent
    return this.makeEvent(
      GoalEventType.QUALIFIED,
      {
        status: GoalStatus.QUALIFIED,
        qualifiedAt: new Date().toISOString(),
      },
      Goal.apply
    ) as GoalQualifiedEvent;
  }

  /**
   * Records progress on the goal by appending a task description.
   * Progress is append-only - completed sub-tasks cannot be removed.
   *
   * @param taskDescription - Description of the completed sub-task
   * @returns GoalProgressUpdated event
   * @throws Error if taskDescription is empty or too long
   */
  updateProgress(taskDescription: string): GoalProgressUpdatedEvent {
    // Input validation: taskDescription must be provided and valid
    const trimmed = taskDescription?.trim();
    if (!trimmed) {
      throw new Error("Task description is required");
    }
    if (trimmed.length > 500) {
      throw new Error("Task description must be less than 500 characters");
    }

    // Create and return event
    return this.makeEvent(
      GoalEventType.PROGRESS_UPDATED,
      {
        taskDescription: trimmed,
      },
      Goal.apply
    ) as GoalProgressUpdatedEvent;
  }
}
