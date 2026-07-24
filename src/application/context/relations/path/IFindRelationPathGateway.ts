import { FindRelationPathRequest } from "./FindRelationPathRequest.js";
import { RelationPathResult } from "./RelationPathResult.js";

export interface IFindRelationPathGateway {
  findPath(request: FindRelationPathRequest): Promise<RelationPathResult>;
}
