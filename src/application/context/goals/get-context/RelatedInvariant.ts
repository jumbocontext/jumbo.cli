import { InvariantView } from "../../invariants/InvariantView.js";

/**
 * RelatedInvariant - An invariant related to a goal, enriched with relation metadata.
 */
export interface RelatedInvariant extends InvariantView {
  readonly relationType: string;
  readonly relationDescription: string;
}
