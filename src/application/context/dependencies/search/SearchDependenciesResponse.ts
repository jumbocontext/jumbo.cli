/**
 * SearchDependenciesResponse - Response DTO for the search-dependencies use case.
 */

import { DependencyView } from "../DependencyView.js";

export interface SearchDependenciesResponse {
  readonly dependencies: DependencyView[];
}
