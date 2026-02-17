import { ShowComponentRequest } from "./ShowComponentRequest.js";
import { ShowComponentResponse } from "./ShowComponentResponse.js";

export interface IShowComponentGateway {
  showComponent(request: ShowComponentRequest): Promise<ShowComponentResponse>;
}
