import { GoalUnblockedEvent } from "../../../../domain/goals/unblock/GoalUnblockedEvent.js";

/**
 * Port interface for projecting GoalUnblockedEvent to the read model.
 * Used by GoalUnblockedEventHandler to update the projection store.
 */
export interface IGoalUnblockedProjector {
  applyGoalUnblocked(event: GoalUnblockedEvent): Promise<void>;
}
