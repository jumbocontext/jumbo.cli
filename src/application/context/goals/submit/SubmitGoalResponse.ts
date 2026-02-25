/**
 * SubmitGoalResponse
 *
 * Response model for goal submit requests.
 * Returns minimal data after successful submission (token optimization).
 */
export interface SubmitGoalResponse {
  readonly goalId: string;
  readonly status: string;
  readonly objective: string;
}
