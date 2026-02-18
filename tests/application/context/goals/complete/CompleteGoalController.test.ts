import { CompleteGoalController } from "../../../../../src/application/context/goals/complete/CompleteGoalController";
import { ICompleteGoalGateway } from "../../../../../src/application/context/goals/complete/ICompleteGoalGateway";

describe("CompleteGoalController", () => {
  let controller: CompleteGoalController;
  let mockGateway: jest.Mocked<ICompleteGoalGateway>;

  beforeEach(() => {
    mockGateway = {
      completeGoal: jest.fn(),
    } as jest.Mocked<ICompleteGoalGateway>;

    controller = new CompleteGoalController(mockGateway);
  });

  it("should delegate to gateway and return response", async () => {
    const request = {
      goalId: "goal_123",
    };

    const expectedResponse = {
      goalId: "goal_123",
      objective: "Complete the controller",
      status: "COMPLETED",
    };

    mockGateway.completeGoal.mockResolvedValue(expectedResponse);

    const response = await controller.handle(request);

    expect(response).toEqual(expectedResponse);
    expect(mockGateway.completeGoal).toHaveBeenCalledWith(request);
  });
});
