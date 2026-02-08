import { GoalView } from "../GoalView.js";

/**
 * Port interface for reading goal projections.
 * Used by QualifyGoalCommandHandler to check goal existence.
 */
export interface IGoalQualifyReader {
  findById(goalId: string): Promise<GoalView | null>;
}
