/**
 * Command to qualify a goal after successful QA review.
 * Transitions goal status from "in-review" to "qualified".
 */
export interface QualifyGoalCommand {
  readonly goalId: string;
}
