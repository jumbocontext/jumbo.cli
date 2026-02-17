import { GetSessionsRequest } from "./GetSessionsRequest.js";
import { GetSessionsResponse } from "./GetSessionsResponse.js";

export interface IGetSessionsGateway {
  getSessions(request: GetSessionsRequest): Promise<GetSessionsResponse>;
}
