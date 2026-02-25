import { GoalSubmittedEvent } from "../../../../domain/goals/submit/GoalSubmittedEvent.js";

/**
 * Port interface for projecting GoalSubmittedEvent to the read model.
 * Used by GoalSubmittedEventHandler to update the projection store.
 */
export interface IGoalSubmittedProjector {
  applyGoalSubmitted(event: GoalSubmittedEvent): Promise<void>;
}
