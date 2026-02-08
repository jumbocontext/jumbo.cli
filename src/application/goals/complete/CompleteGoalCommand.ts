/**
 * Command to complete a goal.
 * Transitions goal status from "doing" or "blocked" to "completed".
 */
export interface CompleteGoalCommand {
  readonly goalId: string;
}
