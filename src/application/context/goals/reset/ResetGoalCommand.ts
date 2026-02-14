/**
 * Command to reset a goal back to 'to-do' status.
 * Can transition from any status (doing, blocked, completed) back to 'to-do'.
 */
export interface ResetGoalCommand {
  readonly goalId: string;
}
