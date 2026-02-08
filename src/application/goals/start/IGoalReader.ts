import { GoalView } from "../GoalView.js";

/**
 * Port interface for reading goal projections.
 * Used by StartGoalCommandHandler to check goal existence.
 */
export interface IGoalReader {
  findById(goalId: string): Promise<GoalView | null>;
}
