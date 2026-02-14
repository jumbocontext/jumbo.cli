/**
 * Command to submit a goal for QA review.
 * Transitions goal status from "doing" or "blocked" to "in-review".
 */
export interface SubmitGoalForReviewCommand {
  readonly goalId: string;
}
