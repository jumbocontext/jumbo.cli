import { GuidelineView } from "../context/guidelines/GuidelineView.js";

/**
 * RelatedGuideline - A guideline related to a goal, enriched with relation metadata.
 */
export interface RelatedGuideline extends GuidelineView {
  readonly relationType: string;
  readonly relationDescription: string;
}
