/**
 * SearchDecisionsResponse - Response DTO for the search-decisions use case.
 */

import { DecisionView } from "../DecisionView.js";

export interface SearchDecisionsResponse {
  readonly decisions: DecisionView[];
}
