/**
 * Command to start the codify phase on a goal.
 * Transitions goal status from "qualified" to "codifying".
 */
export interface CodifyGoalCommand {
  readonly goalId: string;
}
