/**
 * CompleteGoalRequest
 *
 * Request model for goal completion endpoint.
 * Goal must be in QUALIFIED status to be completed.
 */
export interface CompleteGoalRequest {
  readonly goalId: string;
}
