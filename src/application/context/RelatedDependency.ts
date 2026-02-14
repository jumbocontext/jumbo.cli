import { DependencyView } from "../context/dependencies/DependencyView.js";

/**
 * RelatedDependency - A dependency related to a goal, enriched with relation metadata.
 */
export interface RelatedDependency extends DependencyView {
  readonly relationType: string;
  readonly relationDescription: string;
}
