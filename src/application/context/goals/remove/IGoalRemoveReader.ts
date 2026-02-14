import { GoalView } from "../GoalView.js";

/**
 * Port interface for reading goal projections.
 * Used by RemoveGoalCommandHandler to check goal existence.
 */
export interface IGoalRemoveReader {
  findById(goalId: string): Promise<GoalView | null>;
}
