/**
 * CompleteGoalResponse
 *
 * Response model for goal completion requests.
 * Returns minimal data after successful completion (token optimization).
 */
export interface CompleteGoalResponse {
  readonly goalId: string;
  readonly objective: string;
  readonly status: string;
  readonly nextGoal?: {
    readonly goalId: string;
    readonly objective: string;
    readonly status: string;
  };
}
