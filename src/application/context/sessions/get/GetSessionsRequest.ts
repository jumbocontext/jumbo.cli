import { SessionStatusFilter } from "./ISessionViewReader.js";

export interface GetSessionsRequest {
  readonly status: SessionStatusFilter;
}
