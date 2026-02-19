import { AddInvariantRequest } from "./AddInvariantRequest.js";
import { AddInvariantResponse } from "./AddInvariantResponse.js";

export interface IAddInvariantGateway {
  addInvariant(request: AddInvariantRequest): Promise<AddInvariantResponse>;
}
