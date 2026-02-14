import { GoalBlockedEvent } from "../../../../domain/goals/block/GoalBlockedEvent.js";

/**
 * Port interface for projecting GoalBlockedEvent to the read model.
 * Used by GoalBlockedEventHandler to update the projection store.
 */
export interface IGoalBlockedProjector {
  applyGoalBlocked(event: GoalBlockedEvent): Promise<void>;
}
