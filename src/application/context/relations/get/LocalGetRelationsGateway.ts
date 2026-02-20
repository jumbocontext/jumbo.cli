import { IGetRelationsGateway } from "./IGetRelationsGateway.js";
import { GetRelationsRequest } from "./GetRelationsRequest.js";
import { GetRelationsResponse } from "./GetRelationsResponse.js";
import { IRelationViewReader } from "./IRelationViewReader.js";

export class LocalGetRelationsGateway implements IGetRelationsGateway {
  constructor(
    private readonly relationViewReader: IRelationViewReader
  ) {}

  async getRelations(request: GetRelationsRequest): Promise<GetRelationsResponse> {
    const relations = await this.relationViewReader.findAll({
      entityType: request.entityType,
      entityId: request.entityId,
      status: request.status,
    });
    return { relations };
  }
}
