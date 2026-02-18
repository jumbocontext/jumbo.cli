import { BlockGoalRequest } from "./BlockGoalRequest.js";
import { BlockGoalResponse } from "./BlockGoalResponse.js";

export interface IBlockGoalGateway {
  blockGoal(request: BlockGoalRequest): Promise<BlockGoalResponse>;
}
