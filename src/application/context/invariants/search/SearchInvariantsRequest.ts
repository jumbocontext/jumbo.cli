/**
 * SearchInvariantsRequest - Request DTO for the search-invariants use case.
 */

import { InvariantSearchCriteria } from "./InvariantSearchCriteria.js";

export interface SearchInvariantsRequest {
  readonly criteria: InvariantSearchCriteria;
}
