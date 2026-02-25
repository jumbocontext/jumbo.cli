import { GoalApprovedEvent } from "../../../../domain/goals/approve/GoalApprovedEvent.js";

/**
 * Port interface for projecting GoalApprovedEvent to the read model.
 * Used by GoalApprovedEventHandler to update the projection store.
 */
export interface IGoalApprovedProjector {
  applyGoalApproved(event: GoalApprovedEvent): Promise<void>;
}
