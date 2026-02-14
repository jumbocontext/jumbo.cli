import { GoalRemovedEvent } from "../../../../domain/goals/remove/GoalRemovedEvent.js";

/**
 * Port interface for projecting GoalRemovedEvent to the read model.
 * Used by GoalRemovedEventHandler to update the projection store.
 */
export interface IGoalRemovedProjector {
  applyGoalRemoved(event: GoalRemovedEvent): Promise<void>;
}
