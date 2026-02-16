import { ContextualGoalView } from "../get-context/ContextualGoalView.js";

/**
 * ReviewGoalResponse
 *
 * Response model for goal review submission requests.
 * Returns criteria context for QA verification against success criteria.
 */
export interface ReviewGoalResponse {
  readonly goalId: string;
  readonly objective: string;
  readonly status: string;
  readonly criteria: ContextualGoalView;
}
