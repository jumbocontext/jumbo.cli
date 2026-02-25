/**
 * SubmitGoalRequest
 *
 * Request model for goal submit endpoint.
 * Initiates the submit flow to transition a goal from "doing" to "submitted" status.
 */
export interface SubmitGoalRequest {
  readonly goalId: string;
}
