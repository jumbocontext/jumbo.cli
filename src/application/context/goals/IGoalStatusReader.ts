import { GoalStatusType } from "../../../domain/goals/Constants.js";
import { GoalView } from "./GoalView.js";

/**
 * Port interface for reading goals by status.
 * Used by query handlers that need to aggregate goals by status.
 */
export interface IGoalStatusReader {
  findByStatus(status: GoalStatusType): Promise<GoalView[]>;
  findAll(): Promise<GoalView[]>;
}
