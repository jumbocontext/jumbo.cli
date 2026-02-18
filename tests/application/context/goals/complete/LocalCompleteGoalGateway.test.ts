import { LocalCompleteGoalGateway } from "../../../../../src/application/context/goals/complete/LocalCompleteGoalGateway";
import { CompleteGoalCommandHandler } from "../../../../../src/application/context/goals/complete/CompleteGoalCommandHandler";
import { IGoalCompleteReader } from "../../../../../src/application/context/goals/complete/IGoalCompleteReader";
import { GoalClaimPolicy } from "../../../../../src/application/context/goals/claims/GoalClaimPolicy";
import { IWorkerIdentityReader } from "../../../../../src/application/host/workers/IWorkerIdentityReader";
import { GoalStatus } from "../../../../../src/domain/goals/Constants";
import { GoalView } from "../../../../../src/application/context/goals/GoalView";
import { createWorkerId } from "../../../../../src/application/host/workers/WorkerId";

describe("LocalCompleteGoalGateway", () => {
  let gateway: LocalCompleteGoalGateway;
  let mockCommandHandler: jest.Mocked<CompleteGoalCommandHandler>;
  let mockGoalReader: jest.Mocked<IGoalCompleteReader>;
  let mockClaimPolicy: jest.Mocked<GoalClaimPolicy>;
  let mockWorkerIdentityReader: IWorkerIdentityReader;

  const testWorkerId = createWorkerId("test-worker-id");

  beforeEach(() => {
    mockCommandHandler = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CompleteGoalCommandHandler>;

    mockGoalReader = {
      findById: jest.fn(),
    } as jest.Mocked<IGoalCompleteReader>;

    mockClaimPolicy = {
      canClaim: jest.fn().mockReturnValue({ allowed: true }),
    } as unknown as jest.Mocked<GoalClaimPolicy>;

    mockWorkerIdentityReader = {
      workerId: testWorkerId,
    };

    gateway = new LocalCompleteGoalGateway(
      mockCommandHandler,
      mockGoalReader,
      mockClaimPolicy,
      mockWorkerIdentityReader
    );
  });

  it("completes a goal successfully", async () => {
    const mockView: GoalView = {
      goalId: "goal_456",
      objective: "Complete the controller",
      successCriteria: ["Criteria"],
      scopeIn: [],
      scopeOut: [],
      status: GoalStatus.COMPLETED,
      version: 4,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      progress: [],
    };

    mockCommandHandler.execute.mockResolvedValue({} as any);
    mockGoalReader.findById.mockResolvedValue(mockView);

    const response = await gateway.completeGoal({ goalId: "goal_456" });

    expect(response.goalId).toBe("goal_456");
    expect(response.objective).toBe("Complete the controller");
    expect(response.status).toBe(GoalStatus.COMPLETED);
    expect(response.nextGoal).toBeUndefined();
    expect(mockCommandHandler.execute).toHaveBeenCalledWith({ goalId: "goal_456" });
  });

  it("includes next goal in response when present", async () => {
    const mockView: GoalView = {
      goalId: "goal_456",
      objective: "Complete the controller",
      successCriteria: ["Criteria"],
      scopeIn: [],
      scopeOut: [],
      status: GoalStatus.COMPLETED,
      version: 4,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      progress: [],
      nextGoalId: "goal_789",
    };
    const nextGoalView: GoalView = {
      goalId: "goal_789",
      objective: "Next goal objective",
      successCriteria: ["Next criteria"],
      scopeIn: [],
      scopeOut: [],
      status: GoalStatus.TODO,
      version: 1,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      progress: [],
    };

    mockCommandHandler.execute.mockResolvedValue({} as any);
    mockGoalReader.findById
      .mockResolvedValueOnce(mockView)
      .mockResolvedValueOnce(nextGoalView);

    const response = await gateway.completeGoal({ goalId: "goal_456" });

    expect(response.nextGoal).toBeDefined();
    expect(response.nextGoal?.goalId).toBe("goal_789");
    expect(response.nextGoal?.objective).toBe("Next goal objective");
    expect(response.nextGoal?.status).toBe(GoalStatus.TODO);
  });

  it("rejects completion when goal is claimed by another worker", async () => {
    (mockClaimPolicy.canClaim as jest.Mock).mockReturnValue({
      allowed: false,
      reason: "CLAIMED_BY_ANOTHER_WORKER",
      existingClaim: {
        goalId: "goal_123",
        claimedBy: createWorkerId("other-worker-id"),
        claimedAt: "2025-01-15T09:00:00.000Z",
        claimExpiresAt: "2025-01-15T11:00:00.000Z",
      },
    });

    await expect(
      gateway.completeGoal({ goalId: "goal_123" })
    ).rejects.toThrow(
      "Goal is claimed by another worker. Claim expires at 2025-01-15T11:00:00.000Z."
    );

    expect(mockGoalReader.findById).not.toHaveBeenCalled();
    expect(mockCommandHandler.execute).not.toHaveBeenCalled();
  });

  it("throws error when goal not found after completion", async () => {
    mockCommandHandler.execute.mockResolvedValue({} as any);
    mockGoalReader.findById.mockResolvedValue(null);

    await expect(
      gateway.completeGoal({ goalId: "goal_456" })
    ).rejects.toThrow("Goal not found after completion: goal_456");
  });

  it("propagates errors from command handler", async () => {
    mockCommandHandler.execute.mockRejectedValue(
      new Error("Goal is not in QUALIFIED status")
    );

    await expect(
      gateway.completeGoal({ goalId: "goal_123" })
    ).rejects.toThrow("Goal is not in QUALIFIED status");

    expect(mockGoalReader.findById).not.toHaveBeenCalled();
  });
});
