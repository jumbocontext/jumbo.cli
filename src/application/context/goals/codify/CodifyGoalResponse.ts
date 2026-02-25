import { ContextualGoalView } from "../get/ContextualGoalView.js";

/**
 * CodifyGoalResponse
 *
 * Response model for goal codify requests.
 * Returns the enriched goal context view after successful codification start.
 */
export interface CodifyGoalResponse {
  readonly goalContextView: ContextualGoalView;
}
