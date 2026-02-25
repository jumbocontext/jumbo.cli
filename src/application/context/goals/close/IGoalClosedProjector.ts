import { GoalClosedEvent } from "../../../../domain/goals/close/GoalClosedEvent.js";

/**
 * Port interface for projecting GoalClosedEvent to the read model.
 * Used by GoalClosedEventHandler to update the projection store.
 */
export interface IGoalClosedProjector {
  applyGoalClosed(event: GoalClosedEvent): Promise<void>;
}
