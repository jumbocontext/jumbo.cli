import { AddDependencyRequest } from "./AddDependencyRequest.js";
import { AddDependencyResponse } from "./AddDependencyResponse.js";

export interface IAddDependencyGateway {
  addDependency(request: AddDependencyRequest): Promise<AddDependencyResponse>;
}
