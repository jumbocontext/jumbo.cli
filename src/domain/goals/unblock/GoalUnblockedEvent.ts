import { BaseEvent } from "../../BaseEvent.js";
import { GoalEventType } from "../Constants.js";

/**
 * Emitted when a blocked goal is unblocked and resumes.
 * Transitions goal status from 'blocked' back to 'doing'.
 */
export interface GoalUnblockedEvent extends BaseEvent {
  readonly type: typeof GoalEventType.UNBLOCKED;
  readonly payload: {
    readonly status: 'doing';  // Resume to doing
    readonly note?: string;    // Optional resolution note
  };
}
