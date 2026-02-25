/**
 * CloseGoalRequest
 *
 * Request model for goal close endpoint.
 * Goal must be in CODIFYING status to be closed.
 */
export interface CloseGoalRequest {
  readonly goalId: string;
}
