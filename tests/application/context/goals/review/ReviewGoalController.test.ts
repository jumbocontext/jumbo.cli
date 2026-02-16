/**
 * Tests for ReviewGoalController
 *
 * Tests the orchestration of goal review submission.
 */

import { ReviewGoalController } from "../../../../../src/application/context/goals/review/ReviewGoalController";
import { SubmitGoalForReviewCommandHandler } from "../../../../../src/application/context/goals/review/SubmitGoalForReviewCommandHandler";
import { IGoalSubmitForReviewReader } from "../../../../../src/application/context/goals/review/IGoalSubmitForReviewReader";
import { GoalErrorMessages, GoalStatus, formatErrorMessage } from "../../../../../src/domain/goals/Constants";
import { GoalView } from "../../../../../src/application/context/goals/GoalView";
import { GoalClaimPolicy } from "../../../../../src/application/context/goals/claims/GoalClaimPolicy";
import { IWorkerIdentityReader } from "../../../../../src/application/host/workers/IWorkerIdentityReader";
import { createWorkerId } from "../../../../../src/application/host/workers/WorkerId";

describe("ReviewGoalController", () => {
  let submitGoalForReviewCommandHandler: SubmitGoalForReviewCommandHandler;
  let goalReader: IGoalSubmitForReviewReader;
  let claimPolicy: GoalClaimPolicy;
  let workerIdentityReader: IWorkerIdentityReader;

  const testWorkerId = createWorkerId("test-worker-id");

  const createMockGoalView = (overrides?: Partial<GoalView>): GoalView => ({
    goalId: "goal_123",
    objective: "Test objective",
    successCriteria: ["Criteria 1"],
    scopeIn: [],
    scopeOut: [],

    status: GoalStatus.DOING,
    version: 2,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    progress: [],
    ...overrides,
  });

  const createMockGoalContext = (goalView: GoalView) => ({
    goal: goalView,
    context: {
      components: [],
      dependencies: [],
      decisions: [],
      invariants: [],
      guidelines: [],
      architecture: null,
    },
  });

  beforeEach(() => {
    const mockContext = createMockGoalContext(createMockGoalView());

    submitGoalForReviewCommandHandler = {
      execute: jest.fn().mockResolvedValue(mockContext),
    } as unknown as SubmitGoalForReviewCommandHandler;

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

  describe("handle", () => {
    it("successfully submits goal for review and returns criteria context", async () => {
      const mockView = createMockGoalView();
      const mockUpdatedView = createMockGoalView({ status: GoalStatus.INREVIEW });
      const mockContext = createMockGoalContext(mockUpdatedView);

      (goalReader.findById as jest.Mock)
        .mockResolvedValueOnce(mockView)
        .mockResolvedValueOnce(mockUpdatedView);
      (submitGoalForReviewCommandHandler.execute as jest.Mock).mockResolvedValue(mockContext);

      const controller = new ReviewGoalController(
        submitGoalForReviewCommandHandler,
        goalReader,
        claimPolicy,
        workerIdentityReader
      );

      const response = await controller.handle({ goalId: "goal_123" });

      expect(response.goalId).toBe("goal_123");
      expect(response.objective).toBe("Test objective");
      expect(response.status).toBe(GoalStatus.INREVIEW);
      expect(response.criteria).toBe(mockContext);
      expect(submitGoalForReviewCommandHandler.execute).toHaveBeenCalledWith({ goalId: "goal_123" });
    });

    it("rejects when goal is claimed by another worker", async () => {
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

      const controller = new ReviewGoalController(
        submitGoalForReviewCommandHandler,
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
      expect(submitGoalForReviewCommandHandler.execute).not.toHaveBeenCalled();
    });

    it("throws error when goal is not found", async () => {
      (goalReader.findById as jest.Mock).mockResolvedValue(null);

      const controller = new ReviewGoalController(
        submitGoalForReviewCommandHandler,
        goalReader,
        claimPolicy,
        workerIdentityReader
      );

      const expectedMessage = formatErrorMessage(
        GoalErrorMessages.GOAL_NOT_FOUND,
        { id: "goal_nonexistent" }
      );

      await expect(
        controller.handle({ goalId: "goal_nonexistent" })
      ).rejects.toThrow(expectedMessage);

      expect(submitGoalForReviewCommandHandler.execute).not.toHaveBeenCalled();
    });

    it("propagates error from command handler when goal cannot be submitted for review", async () => {
      const mockView = createMockGoalView({ status: GoalStatus.COMPLETED });
      (goalReader.findById as jest.Mock).mockResolvedValue(mockView);

      const commandError = new Error(
        formatErrorMessage(
          GoalErrorMessages.CANNOT_SUBMIT_FOR_REVIEW_IN_STATUS,
          { status: GoalStatus.COMPLETED }
        )
      );
      (submitGoalForReviewCommandHandler.execute as jest.Mock).mockRejectedValue(commandError);

      const controller = new ReviewGoalController(
        submitGoalForReviewCommandHandler,
        goalReader,
        claimPolicy,
        workerIdentityReader
      );

      await expect(
        controller.handle({ goalId: "goal_123" })
      ).rejects.toThrow(commandError.message);

    });

    it("validates claim ownership before any other operation", async () => {
      const callOrder: string[] = [];

      (claimPolicy.canClaim as jest.Mock).mockImplementation(() => {
        callOrder.push("claimPolicy.canClaim");
        return { allowed: true };
      });

      (goalReader.findById as jest.Mock).mockImplementation(() => {
        callOrder.push("goalReader.findById");
        return Promise.resolve(createMockGoalView());
      });

      (submitGoalForReviewCommandHandler.execute as jest.Mock).mockImplementation(() => {
        callOrder.push("commandHandler.execute");
        return Promise.resolve({ goalId: "goal_123" });
      });

      const mockUpdatedView = createMockGoalView({ status: GoalStatus.INREVIEW });
      const mockContext = createMockGoalContext(mockUpdatedView);

      // Second call to findById (after state change)
      (goalReader.findById as jest.Mock)
        .mockResolvedValueOnce(createMockGoalView())
        .mockResolvedValueOnce(mockUpdatedView);


      const controller = new ReviewGoalController(
        submitGoalForReviewCommandHandler,
        goalReader,
        claimPolicy,
        workerIdentityReader
      );

      await controller.handle({ goalId: "goal_123" });

      expect(callOrder[0]).toBe("claimPolicy.canClaim");
    });

    it("returns full criteria context for QA verification", async () => {
      const mockView = createMockGoalView();
      const mockUpdatedView = createMockGoalView({ status: GoalStatus.INREVIEW });

      const mockContext = {
        goal: mockUpdatedView,
        context: {
          components: [{ componentId: "comp_1", name: "Test Component", description: "Desc", status: "active" }],
          dependencies: [{ dependencyId: "dep_1", name: "A -> B", purpose: "API" }],
          decisions: [{ decisionId: "dec_1", title: "Use TypeScript", rationale: "Type safety", status: "active" }],
          invariants: [{ invariantId: "inv_1", title: "coding", description: "Use strict mode" }],
          guidelines: [{ guidelineId: "guide_1", category: "testing", description: "100% coverage" }],
          architecture: null,
        },
      };

      (goalReader.findById as jest.Mock)
        .mockResolvedValueOnce(mockView)
        .mockResolvedValueOnce(mockUpdatedView);
      (submitGoalForReviewCommandHandler.execute as jest.Mock).mockResolvedValue(mockContext);

      const controller = new ReviewGoalController(
        submitGoalForReviewCommandHandler,
        goalReader,
        claimPolicy,
        workerIdentityReader
      );

      const response = await controller.handle({ goalId: "goal_123" });

      expect(response.criteria).toEqual(mockContext);
      expect(response.criteria.context.components).toHaveLength(1);
      expect(response.criteria.context.invariants).toHaveLength(1);
      expect(response.criteria.context.guidelines).toHaveLength(1);
    });
  });
});
