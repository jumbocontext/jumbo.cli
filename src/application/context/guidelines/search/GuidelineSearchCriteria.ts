/**
 * GuidelineSearchCriteria - Search filter for querying guidelines.
 *
 * All fields are optional. When multiple fields are specified,
 * they are combined with AND logic.
 *
 * - category: exact match
 * - title: substring match, or wildcard with * (e.g. Testing*, *Style)
 * - query: substring match across title, description, rationale, and examples (supports * wildcards)
 */

import { GuidelineCategoryValue } from "../../../../domain/guidelines/Constants.js";

export interface GuidelineSearchCriteria {
  readonly category?: GuidelineCategoryValue;
  readonly title?: string;
  readonly query?: string;
}
