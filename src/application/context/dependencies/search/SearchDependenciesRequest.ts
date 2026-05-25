/**
 * SearchDependenciesRequest - Request DTO for the search-dependencies use case.
 */

import { DependencySearchCriteria } from "./DependencySearchCriteria.js";

export interface SearchDependenciesRequest {
  readonly criteria: DependencySearchCriteria;
}
