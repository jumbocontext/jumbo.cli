import { BaseEvent } from "../../BaseEvent.js";
import { GoalEventType, GoalStatusType } from "../Constants.js";

/**
 * Emitted when a goal is reset to 'defined' status.
 * Can transition from any status (doing, blocked, done) back to 'defined'.
 */
export interface GoalResetEvent extends BaseEvent {
  readonly type: typeof GoalEventType.RESET;
  readonly payload: {
    readonly status: GoalStatusType;  // Will be 'defined'
  };
}
