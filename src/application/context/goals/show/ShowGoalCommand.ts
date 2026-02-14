/**
 * Command to show a goal's details.
 * Simple query command - no state changes.
 */
export interface ShowGoalCommand {
  readonly goalId: string;
}
