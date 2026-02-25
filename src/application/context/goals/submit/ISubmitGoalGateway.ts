import { SubmitGoalRequest } from "./SubmitGoalRequest.js";
import { SubmitGoalResponse } from "./SubmitGoalResponse.js";

export interface ISubmitGoalGateway {
  submitGoal(request: SubmitGoalRequest): Promise<SubmitGoalResponse>;
}
