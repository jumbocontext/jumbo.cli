import { BaseEvent, UUID } from "../../BaseEvent.js";
import { GoalEventType } from "../Constants.js";

/**
 * Emitted when a goal's properties are updated.
 * Only fields provided in payload are updated; omitted fields remain unchanged.
 */
export interface GoalUpdatedEvent extends BaseEvent {
  readonly type: typeof GoalEventType.UPDATED;
  readonly payload: {
    readonly title?: string;
    readonly objective?: string;
    readonly successCriteria?: string[];
    readonly scopeIn?: string[];
    readonly scopeOut?: string[];
    readonly nextGoalId?: UUID;
    readonly prerequisiteGoals?: UUID[];
    readonly branch?: string;
    readonly worktree?: string;
  };
}
