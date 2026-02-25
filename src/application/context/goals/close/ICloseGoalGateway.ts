import { CloseGoalRequest } from "./CloseGoalRequest.js";
import { CloseGoalResponse } from "./CloseGoalResponse.js";

export interface ICloseGoalGateway {
  closeGoal(request: CloseGoalRequest): Promise<CloseGoalResponse>;
}
