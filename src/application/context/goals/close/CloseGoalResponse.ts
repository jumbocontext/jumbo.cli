/**
 * CloseGoalResponse
 *
 * Response model for goal close requests.
 * Returns minimal data after successful close (token optimization).
 */
export interface CloseGoalResponse {
  readonly goalId: string;
  readonly objective: string;
  readonly status: string;
  readonly nextGoal?: {
    readonly goalId: string;
    readonly objective: string;
    readonly status: string;
  };
}
