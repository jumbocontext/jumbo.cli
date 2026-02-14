import { GoalView } from "../GoalView.js";

/**
 * Port interface for reading goal projections.
 * Used by UpdateGoalCommandHandler to check goal existence.
 */
export interface IGoalUpdateReader {
  findById(goalId: string): Promise<GoalView | null>;
}
