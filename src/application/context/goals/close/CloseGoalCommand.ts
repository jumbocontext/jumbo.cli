/**
 * Command to close a goal after codification is complete.
 * Transitions goal status from "codifying" to "done".
 */
export interface CloseGoalCommand {
  readonly goalId: string;
}
