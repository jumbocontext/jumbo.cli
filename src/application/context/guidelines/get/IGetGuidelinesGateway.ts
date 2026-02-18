import { GetGuidelinesRequest } from "./GetGuidelinesRequest.js";
import { GetGuidelinesResponse } from "./GetGuidelinesResponse.js";

export interface IGetGuidelinesGateway {
  getGuidelines(request: GetGuidelinesRequest): Promise<GetGuidelinesResponse>;
}
