/**
 * RejectGoalResponse
 *
 * Response model for goal rejection requests.
 * Returns goal data and review issues after successful rejection.
 */
export interface RejectGoalResponse {
  readonly goalId: string;
  readonly status: string;
  readonly objective: string;
  readonly reviewIssues: string;
  readonly nextGoalId?: string;
}
