import { PauseWorkRequest } from "./PauseWorkRequest.js";
import { PauseWorkResponse } from "./PauseWorkResponse.js";

export interface IPauseWorkGateway {
  pauseWork(request: PauseWorkRequest): Promise<PauseWorkResponse>;
}
