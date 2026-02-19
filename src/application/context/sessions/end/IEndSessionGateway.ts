import { EndSessionRequest } from "./EndSessionRequest.js";
import { EndSessionResponse } from "./EndSessionResponse.js";

export interface IEndSessionGateway {
  endSession(request: EndSessionRequest): Promise<EndSessionResponse>;
}
