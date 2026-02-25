import { GoalView } from "../GoalView.js";

/**
 * Port interface for reading goal projections.
 * Used by CodifyGoalCommandHandler to check goal existence.
 */
export interface IGoalCodifyReader {
  findById(goalId: string): Promise<GoalView | null>;
}
