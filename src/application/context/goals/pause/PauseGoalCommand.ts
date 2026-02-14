import { GoalPausedReasonsType } from "../../../../domain/goals/GoalPausedReasons.js";

/**
 * Command to pause an active goal.
 * Transitions goal status from "doing" to "paused".
 */
export interface PauseGoalCommand {
  readonly goalId: string;
  readonly reason: GoalPausedReasonsType;
  readonly note?: string;
}
