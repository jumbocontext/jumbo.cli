import { GoalResumedEvent } from "../../../../domain/goals/resume/GoalResumedEvent.js";

/**
 * Port interface for projecting GoalResumedEvent to the read model.
 * Used by GoalResumedEventHandler to update the projection store.
 */
export interface IGoalResumedProjector {
  applyGoalResumed(event: GoalResumedEvent): Promise<void>;
}
