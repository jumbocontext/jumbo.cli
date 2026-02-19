import { GetRelationsRequest } from "./GetRelationsRequest.js";
import { GetRelationsResponse } from "./GetRelationsResponse.js";

export interface IGetRelationsGateway {
  getRelations(request: GetRelationsRequest): Promise<GetRelationsResponse>;
}
