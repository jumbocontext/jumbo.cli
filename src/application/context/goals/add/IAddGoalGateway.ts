import { AddGoalRequest } from "./AddGoalRequest.js";
import { AddGoalResponse } from "./AddGoalResponse.js";

export interface IAddGoalGateway {
  addGoal(request: AddGoalRequest): Promise<AddGoalResponse>;
}
