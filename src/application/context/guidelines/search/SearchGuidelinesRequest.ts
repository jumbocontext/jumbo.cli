/**
 * SearchGuidelinesRequest - Request DTO for the search-guidelines use case.
 */

import { GuidelineSearchCriteria } from "./GuidelineSearchCriteria.js";

export interface SearchGuidelinesRequest {
  readonly criteria: GuidelineSearchCriteria;
}
