/**
 * SearchInvariantsResponse - Response DTO for the search-invariants use case.
 */

import { InvariantView } from "../InvariantView.js";

export interface SearchInvariantsResponse {
  readonly invariants: InvariantView[];
}
