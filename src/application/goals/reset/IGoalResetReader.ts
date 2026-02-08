import { GoalView } from "../GoalView.js";

/**
 * Port interface for reading goal projections.
 * Used by ResetGoalCommandHandler to check goal existence.
 */
export interface IGoalResetReader {
  findById(goalId: string): Promise<GoalView | null>;
}
