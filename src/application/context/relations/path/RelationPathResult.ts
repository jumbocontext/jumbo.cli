import { RelationView } from "../RelationView.js";
import { RelationNodeReference } from "../get/RelationNodeReference.js";
import { RelationPathQueryMetadata } from "./RelationPathQueryMetadata.js";

export interface RelationPathResult {
  readonly found: boolean;
  readonly from: RelationNodeReference;
  readonly to: RelationNodeReference;
  readonly hopCount: number;
  readonly nodes: RelationNodeReference[];
  readonly edges: RelationView[];
  readonly query: RelationPathQueryMetadata;
}
