/**
 * Command to submit a goal after implementation is complete.
 * Transitions goal status from "doing" to "submitted".
 */
export interface SubmitGoalCommand {
  readonly goalId: string;
}
