/**
 * CodifyGoalRequest
 *
 * Request model for goal codify endpoint.
 * Goal must be in QUALIFIED status to be codified.
 */
export interface CodifyGoalRequest {
  readonly goalId: string;
}
