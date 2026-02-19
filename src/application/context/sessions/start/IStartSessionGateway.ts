import { SessionStartRequest } from "./SessionStartRequest.js";
import { SessionStartResponse } from "./SessionStartResponse.js";

export interface IStartSessionGateway {
  startSession(request: SessionStartRequest): Promise<SessionStartResponse>;
}
