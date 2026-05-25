/**
 * InvariantSearchCriteria - Search filter for querying invariants.
 *
 * All fields are optional. When multiple fields are specified,
 * they are combined with AND logic.
 *
 * - title: substring match, or wildcard with * (e.g. Clean*, *Architecture)
 * - query: substring match across title, description, and rationale fields (supports * wildcards)
 */

export interface InvariantSearchCriteria {
  readonly title?: string;
  readonly query?: string;
}
