import { BaseEvent } from "../../BaseEvent.js";
import { GoalEventType, GoalStatusType } from "../Constants.js";

/**
 * Emitted when a goal is submitted for QA review.
 * Transitions goal status from "doing" to "in-review".
 * Marks the point where implementation is considered complete and awaiting validation.
 */
export interface GoalSubmittedForReviewEvent extends BaseEvent {
  readonly type: typeof GoalEventType.SUBMITTED_FOR_REVIEW;
  readonly payload: {
    readonly status: GoalStatusType;  // Will be 'in-review'
    readonly submittedAt: string;     // ISO 8601 timestamp when submitted
  };
}
