import { GoalCodifyingStartedEvent } from "../../../../domain/goals/codify/GoalCodifyingStartedEvent.js";

/**
 * Port interface for projecting GoalCodifyingStartedEvent to the read model.
 * Used by GoalCodifyingStartedEventHandler to update the projection store.
 */
export interface IGoalCodifyingStartedProjector {
  applyGoalCodifyingStarted(event: GoalCodifyingStartedEvent): Promise<void>;
}
