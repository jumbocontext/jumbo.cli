import { IGetRelationsGateway } from "../../../../application/context/relations/get/IGetRelationsGateway.js";
import { GetRelationsRequest } from "../../../../application/context/relations/get/GetRelationsRequest.js";
import { GetRelationsResponse } from "../../../../application/context/relations/get/GetRelationsResponse.js";
import { IRelationViewReader } from "../../../../application/context/relations/get/IRelationViewReader.js";

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
