import { BaseEvent } from "../../BaseEvent.js";
import { GoalEventType, GoalStatusType } from "../Constants.js";

/**
 * Emitted when a goal is reset to 'to-do' status.
 * Can transition from any status (doing, blocked, completed) back to 'to-do'.
 */
export interface GoalResetEvent extends BaseEvent {
  readonly type: typeof GoalEventType.RESET;
  readonly payload: {
    readonly status: GoalStatusType;  // Will be 'to-do'
  };
}
