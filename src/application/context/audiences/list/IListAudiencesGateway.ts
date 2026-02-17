import { ListAudiencesRequest } from "./ListAudiencesRequest.js";
import { ListAudiencesResponse } from "./ListAudiencesResponse.js";

export interface IListAudiencesGateway {
  listAudiences(request: ListAudiencesRequest): Promise<ListAudiencesResponse>;
}
