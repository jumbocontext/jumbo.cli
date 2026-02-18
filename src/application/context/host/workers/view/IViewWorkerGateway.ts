import { ViewWorkerRequest } from "./ViewWorkerRequest.js";
import { ViewWorkerResponse } from "./ViewWorkerResponse.js";

export interface IViewWorkerGateway {
  viewWorker(request: ViewWorkerRequest): Promise<ViewWorkerResponse>;
}
