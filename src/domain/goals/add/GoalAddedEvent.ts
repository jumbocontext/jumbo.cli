import { BaseEvent, UUID } from "../../BaseEvent.js";
import { GoalEventType, GoalStatusType } from "../Constants.js";

/**
 * Emitted when a new goal is defined.
 * This is the first event in the Goal aggregate's lifecycle.
 * Goal starts in 'defined' status.
 */
export interface GoalAddedEvent extends BaseEvent {
  readonly type: typeof GoalEventType.ADDED;
  readonly payload: {
    readonly title: string;
    readonly objective: string;
    readonly successCriteria: string[];
    readonly scopeIn: string[];
    readonly scopeOut: string[];
    readonly status: GoalStatusType;
    readonly nextGoalId?: UUID;
    readonly prerequisiteGoals?: UUID[];
    readonly branch?: string;
    readonly worktree?: string;
  };
}
