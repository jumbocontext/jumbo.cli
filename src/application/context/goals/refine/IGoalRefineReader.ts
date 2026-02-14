import { GoalView } from "../GoalView.js";

/**
 * Port interface for reading goal projections.
 * Used by RefineGoalCommandHandler to check goal existence.
 */
export interface IGoalRefineReader {
  findById(goalId: string): Promise<GoalView | null>;
}
