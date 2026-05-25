/**
 * SearchGuidelinesResponse - Response DTO for the search-guidelines use case.
 */

import { GuidelineView } from "../GuidelineView.js";

export interface SearchGuidelinesResponse {
  readonly guidelines: GuidelineView[];
}
