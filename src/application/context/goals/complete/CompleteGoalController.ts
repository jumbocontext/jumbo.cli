import { CompleteGoalRequest } from "./CompleteGoalRequest.js";
import { CompleteGoalResponse } from "./CompleteGoalResponse.js";
import { ICompleteGoalGateway } from "./ICompleteGoalGateway.js";

export class CompleteGoalController {
  constructor(
    private readonly gateway: ICompleteGoalGateway
  ) {}

  async handle(request: CompleteGoalRequest): Promise<CompleteGoalResponse> {
    return this.gateway.completeGoal(request);
  }
}
