/**
 * Command to refine a goal, marking it ready to be started.
 * Transitions status from 'to-do' to 'refined'.
 */
export interface RefineGoalCommand {
  readonly goalId: string;
}
