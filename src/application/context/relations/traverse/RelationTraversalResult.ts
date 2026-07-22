import { RelationView } from "../RelationView.js";
import { RelationNodeReference } from "../get/RelationNodeReference.js";
import { RelationTraversalNode } from "./RelationTraversalNode.js";

export interface RelationTraversalResult {
  readonly root: RelationNodeReference;
  readonly nodes: RelationTraversalNode[];
  readonly edges: RelationView[];
  readonly requestedDepth: number;
  readonly reachedDepth: number;
  readonly limit: number;
  readonly truncated: boolean;
}
