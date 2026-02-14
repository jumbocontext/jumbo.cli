import { DecisionView } from "../context/decisions/DecisionView.js";

/**
 * RelatedDecision - A decision related to a goal, enriched with relation metadata.
 */
export interface RelatedDecision extends DecisionView {
  readonly relationType: string;
  readonly relationDescription: string;
}
