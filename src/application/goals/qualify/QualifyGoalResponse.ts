/**
 * QualifyGoalResponse
 *
 * Response model for goal qualification requests.
 * Returns goal details after successful qualification with instructions to complete.
 */
export interface QualifyGoalResponse {
  readonly goalId: string;
  readonly objective: string;
  readonly status: string;
  readonly nextGoalId?: string;
}
