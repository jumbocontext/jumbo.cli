import { BaseEvent } from "../../BaseEvent.js";
import { GoalEventType, GoalStatusType } from "../Constants.js";

/**
 * Emitted when a goal passes QA review and is qualified for completion.
 * Transitions goal status from "in-review" to "qualified".
 * Marks the point where a goal has been validated and can proceed to completion.
 */
export interface GoalQualifiedEvent extends BaseEvent {
  readonly type: typeof GoalEventType.QUALIFIED;
  readonly payload: {
    readonly status: GoalStatusType;  // Will be 'qualified'
    readonly qualifiedAt: string;     // ISO 8601 timestamp when qualified
  };
}
