import { GoalResetEvent } from "../../../../domain/goals/reset/GoalResetEvent.js";

/**
 * Port interface for projecting GoalResetEvent to the read model.
 * Used by GoalResetEventHandler to update the projection store.
 */
export interface IGoalResetProjector {
  applyGoalReset(event: GoalResetEvent): Promise<void>;
}
