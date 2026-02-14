/**
 * Tests for CompleteGoalController
 *
 * Tests the simplified completion controller that handles only QUALIFIED goals.
 * Review logic has been moved to ReviewGoalController.
 */

import { CompleteGoalController } from "../../../../../src/application/context/goals/complete/CompleteGoalController";
import { CompleteGoalCommandHandler } from "../../../../../src/application/context/goals/complete/CompleteGoalCommandHandler";
import { IGoalCompleteReader } from "../../../../../src/application/context/goals/complete/IGoalCompleteReader";
import { GoalErrorMessages, GoalStatus, formatErrorMessage } from "../../../../../src/domain/goals/Constants";
import { GoalView } from "../../../../../src/application/context/goals/GoalView";
import { GoalClaimPolicy } from "../../../../../src/application/context/goals/claims/GoalClaimPolicy";
import { IWorkerIdentityReader } from "../../../../../src/application/host/workers/IWorkerIdentityReader";
import { createWorkerId } from "../../../../../src/application/host/workers/WorkerId";

describe("CompleteGoalController", () => {
  let completeGoalCommandHandler: CompleteGoalCommandHandler;
  let goalReader: IGoalCompleteReader;
  let claimPolicy: GoalClaimPolicy;
  let workerIdentityReader: IWorkerIdentityReader;

  const testWorkerId = createWorkerId("test-worker-id");

  beforeEach(() => {
    completeGoalCommandHandler = {
      execute: jest.fn(),
    } as unknown as CompleteGoalCommandHandler;

    goalReader = {
      findById: jest.fn(),
    };

    // Mock claim policy - default to allowing claims (no existing claim)
    claimPolicy = {
      canClaim: jest.fn().mockReturnValue({ allowed: true }),
    } as unknown as GoalClaimPolicy;

    workerIdentityReader = {
      workerId: testWorkerId,
    };
  });

  it("completes a qualified goal successfully", async () => {
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
    (goalReader.findById as jest.Mock).mockResolvedValue(mockView);
    (completeGoalCommandHandler.execute as jest.Mock).mockResolvedValue({ goalId: "goal_456" });

    const controller = new CompleteGoalController(
      completeGoalCommandHandler,
      goalReader,
      claimPolicy,
      workerIdentityReader
    );

    const response = await controller.handle({ goalId: "goal_456" });

    expect(completeGoalCommandHandler.execute).toHaveBeenCalledWith({ goalId: "goal_456" });
    expect(response.status).toBe(GoalStatus.COMPLETED);
    expect(response.goalId).toBe("goal_456");
    expect(response.objective).toBe("Complete the controller");
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
    (goalReader.findById as jest.Mock)
      .mockResolvedValueOnce(mockView)
      .mockResolvedValueOnce(nextGoalView);
    (completeGoalCommandHandler.execute as jest.Mock).mockResolvedValue({ goalId: "goal_456" });

    const controller = new CompleteGoalController(
      completeGoalCommandHandler,
      goalReader,
      claimPolicy,
      workerIdentityReader
    );

    const response = await controller.handle({ goalId: "goal_456" });

    expect(response.nextGoal).toBeDefined();
    expect(response.nextGoal?.goalId).toBe("goal_789");
    expect(response.nextGoal?.objective).toBe("Next goal objective");
    expect(response.nextGoal?.status).toBe(GoalStatus.TODO);
  });

  it("rejects completion when goal is claimed by another worker", async () => {
    // Mock another worker's active claim
    const otherWorkerId = createWorkerId("other-worker-id");
    (claimPolicy.canClaim as jest.Mock).mockReturnValue({
      allowed: false,
      reason: "CLAIMED_BY_ANOTHER_WORKER",
      existingClaim: {
        goalId: "goal_123",
        claimedBy: otherWorkerId,
        claimedAt: "2025-01-15T09:00:00.000Z",
        claimExpiresAt: "2025-01-15T11:00:00.000Z",
      },
    });

    const controller = new CompleteGoalController(
      completeGoalCommandHandler,
      goalReader,
      claimPolicy,
      workerIdentityReader
    );

    await expect(
      controller.handle({ goalId: "goal_123" })
    ).rejects.toThrow(
      "Goal is claimed by another worker. Claim expires at 2025-01-15T11:00:00.000Z."
    );

    // Verify nothing else was called
    expect(goalReader.findById).not.toHaveBeenCalled();
    expect(completeGoalCommandHandler.execute).not.toHaveBeenCalled();
  });

  it("throws error when goal not found after completion", async () => {
    (completeGoalCommandHandler.execute as jest.Mock).mockResolvedValue({ goalId: "goal_456" });
    (goalReader.findById as jest.Mock).mockResolvedValue(null);

    const controller = new CompleteGoalController(
      completeGoalCommandHandler,
      goalReader,
      claimPolicy,
      workerIdentityReader
    );

    await expect(
      controller.handle({ goalId: "goal_456" })
    ).rejects.toThrow("Goal not found after completion: goal_456");
  });

  it("propagates errors from command handler", async () => {
    const errorMessage = formatErrorMessage(GoalErrorMessages.NOT_QUALIFIED, {});
    (completeGoalCommandHandler.execute as jest.Mock).mockRejectedValue(
      new Error(errorMessage)
    );

    const controller = new CompleteGoalController(
      completeGoalCommandHandler,
      goalReader,
      claimPolicy,
      workerIdentityReader
    );

    await expect(
      controller.handle({ goalId: "goal_123" })
    ).rejects.toThrow(errorMessage);

    expect(goalReader.findById).not.toHaveBeenCalled();
  });
});
