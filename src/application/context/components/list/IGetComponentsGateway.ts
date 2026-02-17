import { GetComponentsRequest } from "./GetComponentsRequest.js";
import { GetComponentsResponse } from "./GetComponentsResponse.js";

export interface IGetComponentsGateway {
  getComponents(request: GetComponentsRequest): Promise<GetComponentsResponse>;
}
