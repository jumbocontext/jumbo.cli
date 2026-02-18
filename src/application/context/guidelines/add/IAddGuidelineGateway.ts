import { AddGuidelineRequest } from "./AddGuidelineRequest.js";
import { AddGuidelineResponse } from "./AddGuidelineResponse.js";

export interface IAddGuidelineGateway {
  addGuideline(request: AddGuidelineRequest): Promise<AddGuidelineResponse>;
}
