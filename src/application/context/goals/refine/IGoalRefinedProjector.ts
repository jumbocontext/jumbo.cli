import { GoalRefinedEvent } from "../../../../domain/goals/refine/GoalRefinedEvent.js";

/**
 * Port interface for projecting GoalRefinedEvent to the read model.
 * Used by GoalRefinedEventHandler to update the projection store.
 */
export interface IGoalRefinedProjector {
  applyGoalRefined(event: GoalRefinedEvent): Promise<void>;
}
