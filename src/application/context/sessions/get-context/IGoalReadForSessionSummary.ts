import { GoalView } from "../../goals/GoalView.js";

/**
 * Port interface for reading goal data for session summary projection.
 * Used by SessionSummaryProjectionHandler to enrich goal events.
 */
export interface IGoalReadForSessionSummary {
  findById(goalId: string): Promise<GoalView | null>;
}
