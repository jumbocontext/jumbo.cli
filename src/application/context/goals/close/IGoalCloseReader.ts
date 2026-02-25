import { GoalView } from "../GoalView.js";

/**
 * Port interface for reading goal projections.
 * Used by CloseGoalCommandHandler to check goal existence.
 */
export interface IGoalCloseReader {
  findById(goalId: string): Promise<GoalView | null>;
}
