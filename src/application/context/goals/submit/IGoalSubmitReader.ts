import { GoalView } from "../GoalView.js";

/**
 * Port interface for reading goal projections.
 * Used by SubmitGoalCommandHandler to check goal existence.
 */
export interface IGoalSubmitReader {
  findById(goalId: string): Promise<GoalView | null>;
}
