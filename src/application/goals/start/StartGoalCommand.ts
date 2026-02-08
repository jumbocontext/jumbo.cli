/**
 * Command to start a defined goal.
 * Transitions goal status from "to-do" to "doing".
 */
export interface StartGoalCommand {
  readonly goalId: string;
}
