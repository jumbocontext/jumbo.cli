import { AddAudienceRequest } from "./AddAudienceRequest.js";
import { AddAudienceResponse } from "./AddAudienceResponse.js";

export interface IAddAudienceGateway {
  addAudience(request: AddAudienceRequest): Promise<AddAudienceResponse>;
}
