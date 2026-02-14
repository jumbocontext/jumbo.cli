import { GoalPausedEvent } from "../../../../domain/goals/pause/GoalPausedEvent.js";

/**
 * Port interface for projecting GoalPausedEvent to the read model.
 * Used by GoalPausedEventHandler to update the projection store.
 */
export interface IGoalPausedProjector {
  applyGoalPaused(event: GoalPausedEvent): Promise<void>;
}
