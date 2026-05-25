/**
 * SearchDecisionsRequest - Request DTO for the search-decisions use case.
 */

import { DecisionSearchCriteria } from "./DecisionSearchCriteria.js";

export interface SearchDecisionsRequest {
  readonly criteria: DecisionSearchCriteria;
}
