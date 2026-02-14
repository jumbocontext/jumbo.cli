/**
 * QualifyGoalRequest
 *
 * Request model for goal qualification endpoint.
 * Initiates the qualification flow to transition a goal from "in-review" to "qualified" status.
 */
export interface QualifyGoalRequest {
  readonly goalId: string;
}
