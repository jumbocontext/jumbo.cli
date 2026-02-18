import { CompleteGoalRequest } from "./CompleteGoalRequest.js";
import { CompleteGoalResponse } from "./CompleteGoalResponse.js";

export interface ICompleteGoalGateway {
  completeGoal(request: CompleteGoalRequest): Promise<CompleteGoalResponse>;
}
