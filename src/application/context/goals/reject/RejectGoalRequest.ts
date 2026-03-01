/**
 * RejectGoalRequest
 *
 * Request model for goal rejection endpoint.
 * Initiates the rejection flow to transition a goal from "in-review" to "rejected" status.
 */
export interface RejectGoalRequest {
  readonly goalId: string;
  readonly reviewIssues: string;
}
