/**
 * Command to reject a goal after failed QA review.
 * Transitions goal status from "in-review" to "rejected".
 */
export interface RejectGoalCommand {
  readonly goalId: string;
  readonly reviewIssues: string;
}
