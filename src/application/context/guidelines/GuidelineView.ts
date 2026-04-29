/**
 * GuidelineView
 *
 * Read model for querying guideline data.
 * Represents the materialized view of a guideline aggregate.
 */

import { GuidelineCategoryValue } from "../../../domain/guidelines/Constants.js";

export interface GuidelineView {
  guidelineId: string;
  category: GuidelineCategoryValue;
  title: string;
  description: string;
  rationale: string;
  examples: string[];
  isRemoved: boolean;
  removedAt: string | null;
  removalReason: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}
