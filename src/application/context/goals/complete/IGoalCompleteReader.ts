import { GoalView } from "../GoalView.js";

/**
 * Port interface for reading goal projections.
 * Used by CompleteGoalCommandHandler to check goal existence.
 */
export interface IGoalCompleteReader {
  findById(goalId: string): Promise<GoalView | null>;
}
