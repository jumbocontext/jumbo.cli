import { FindRelationPathRequest } from "./FindRelationPathRequest.js";
import { IFindRelationPathGateway } from "./IFindRelationPathGateway.js";
import { RelationPathResult } from "./RelationPathResult.js";

export class FindRelationPathController {
  constructor(private readonly gateway: IFindRelationPathGateway) {}

  async handle(request: FindRelationPathRequest): Promise<RelationPathResult> {
    return this.gateway.findPath(request);
  }
}
