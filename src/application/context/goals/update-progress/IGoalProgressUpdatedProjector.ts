import { GoalProgressUpdatedEvent } from "../../../../domain/goals/update-progress/GoalProgressUpdatedEvent.js";

/**
 * Port interface for projecting GoalProgressUpdatedEvent to the read model.
 * Used by GoalProgressUpdatedEventHandler to update the projection store.
 */
export interface IGoalProgressUpdatedProjector {
  applyGoalProgressUpdated(event: GoalProgressUpdatedEvent): Promise<void>;
}
