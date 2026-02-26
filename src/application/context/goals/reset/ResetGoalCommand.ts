/**
 * Command to reset a goal back to its last waiting state.
 * Can transition from in-progress states and terminal states back to their
 * corresponding waiting state. Blocked and waiting states cannot be reset.
 */
export interface ResetGoalCommand {
  readonly goalId: string;
}
