import { GoalView } from "../GoalView.js";

/**
 * Port interface for reading goal context data.
 * Used by GetGoalContextQueryHandler to retrieve goal details.
 */
export interface IGoalContextReader {
  findById(goalId: string): Promise<GoalView | null>;
}
