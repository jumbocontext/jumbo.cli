import { GetDecisionsRequest } from "./GetDecisionsRequest.js";
import { GetDecisionsResponse } from "./GetDecisionsResponse.js";

export interface IGetDecisionsGateway {
  getDecisions(request: GetDecisionsRequest): Promise<GetDecisionsResponse>;
}
