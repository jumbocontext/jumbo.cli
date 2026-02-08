/**
 * Command to resume a paused goal.
 * Transitions goal status from "paused" to "doing".
 */
export interface ResumeGoalCommand {
  readonly goalId: string;
  readonly note?: string;
}
