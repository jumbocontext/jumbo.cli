import { ComponentView } from "../context/components/ComponentView.js";

/**
 * RelatedComponent - A component related to a goal, enriched with relation metadata.
 */
export interface RelatedComponent extends ComponentView {
  readonly relationType: string;
  readonly relationDescription: string;
}
