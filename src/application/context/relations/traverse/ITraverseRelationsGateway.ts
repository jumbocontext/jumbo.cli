import { RelationTraversalResult } from "./RelationTraversalResult.js";
import { TraverseRelationsRequest } from "./TraverseRelationsRequest.js";

export interface ITraverseRelationsGateway {
  traverse(request: TraverseRelationsRequest): Promise<RelationTraversalResult>;
}
