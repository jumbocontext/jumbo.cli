import { CodifyGoalRequest } from "./CodifyGoalRequest.js";
import { CodifyGoalResponse } from "./CodifyGoalResponse.js";

export interface ICodifyGoalGateway {
  codifyGoal(request: CodifyGoalRequest): Promise<CodifyGoalResponse>;
}
