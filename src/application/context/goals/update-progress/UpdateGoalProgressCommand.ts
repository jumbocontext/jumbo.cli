/**
 * Command to update progress on a goal.
 * Appends a task description to the goal's progress array.
 */
export interface UpdateGoalProgressCommand {
  readonly goalId: string;
  readonly taskDescription: string;
}
