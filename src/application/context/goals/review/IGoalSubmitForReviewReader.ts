import { GoalView } from "../GoalView.js";

/**
 * Port interface for reading goal projections.
 * Used by SubmitGoalForReviewCommandHandler to check goal existence.
 */
export interface IGoalSubmitForReviewReader {
  findById(goalId: string): Promise<GoalView | null>;
}
