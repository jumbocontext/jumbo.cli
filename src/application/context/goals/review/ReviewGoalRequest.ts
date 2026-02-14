/**
 * ReviewGoalRequest
 *
 * Request model for goal review submission endpoint.
 * Initiates the QA gate flow to transition a goal to "in-review" status.
 */
export interface ReviewGoalRequest {
  readonly goalId: string;
}
