/**
 * DependencySearchCriteria - Search filter for querying dependency memories.
 *
 * All fields are optional. When multiple fields are specified,
 * they are combined with AND logic.
 *
 * Identity fields use substring matching by default and support * wildcards.
 * Status uses exact matching.
 * Query searches across identity and descriptive dependency fields.
 */

import { DependencyStatusType } from "../../../../domain/dependencies/Constants.js";

export interface DependencySearchCriteria {
  readonly name?: string;
  readonly ecosystem?: string;
  readonly packageName?: string;
  readonly versionConstraint?: string;
  readonly status?: DependencyStatusType;
  readonly consumer?: string;
  readonly provider?: string;
  readonly query?: string;
}
