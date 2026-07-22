import { RelationNodeReference } from "../get/RelationNodeReference.js";

export interface RelationTraversalNode extends RelationNodeReference {
  readonly distance: number;
}
