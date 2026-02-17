import { AddComponentRequest } from "./AddComponentRequest.js";
import { AddComponentResponse } from "./AddComponentResponse.js";

export interface IAddComponentGateway {
  addComponent(request: AddComponentRequest): Promise<AddComponentResponse>;
}
