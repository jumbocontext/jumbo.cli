import { GoalStartedEvent } from "../../../../domain/goals/start/GoalStartedEvent.js";

/**
 * Port interface for projecting GoalStartedEvent to the read model.
 * Used by GoalStartedEventHandler to update the projection store.
 */
export interface IGoalStartedProjector {
  applyGoalStarted(event: GoalStartedEvent): Promise<void>;
}
