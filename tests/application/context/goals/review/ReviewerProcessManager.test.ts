import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { ReviewerProcessManager } from "../../../../../src/application/context/goals/review/ReviewerProcessManager";
import { GoalStatus } from "../../../../../src/domain/goals/Constants";

describe("ReviewerProcessManager", () => {
  const goal = {
    goalId: "goal_1",
    objective: "Review objective",
    createdAt: "2026-01-01T00:00:00.000Z",
    status: GoalStatus.SUBMITTED,
  } as any;
  let goalStatusReader: { findByStatus: jest.Mock; findAll: jest.Mock };
  let goalReader: { findById: jest.Mock };
  let claimPolicy: { canClaim: jest.Mock };
  let reviewGoalController: { handle: jest.Mock };
  let agentGateway: { invoke: jest.Mock };
  let telemetryClient: { track: jest.Mock; flush: jest.Mock; shutdown: jest.Mock };

  beforeEach(() => {
    goalStatusReader = { findByStatus: jest.fn().mockResolvedValue([goal]), findAll: jest.fn() };
    goalReader = { findById: jest.fn().mockResolvedValue({ ...goal, status: GoalStatus.REJECTED }) };
    claimPolicy = { canClaim: jest.fn().mockReturnValue({ allowed: true }) };
    reviewGoalController = { handle: jest.fn().mockResolvedValue({}) };
    agentGateway = { invoke: jest.fn().mockResolvedValue({ exitCode: 0 }) };
    telemetryClient = { track: jest.fn(), flush: jest.fn(), shutdown: jest.fn() };
  });

  it("preserves legacy submitted-goal selection and review prompt semantics", async () => {
    const manager = new ReviewerProcessManager(
      goalStatusReader,
      goalReader,
      claimPolicy as any,
      { workerId: "worker_1" },
      reviewGoalController as any,
      agentGateway,
      telemetryClient,
    );

    await expect(manager.processNext({ agentId: "codex", maxRetries: 1 })).resolves.toEqual({
      status: "completed",
      goalId: "goal_1",
      attempts: 1,
    });
    expect(goalStatusReader.findByStatus).toHaveBeenCalledWith(GoalStatus.SUBMITTED);
    expect(reviewGoalController.handle).toHaveBeenCalledWith({ goalId: "goal_1" });
    expect(agentGateway.invoke).toHaveBeenCalledWith({
      agentId: "codex",
      prompt: "Run the Jumbo review workflow for goal goal_1. Execute: jumbo goal review --id goal_1",
    });
  });

  it("emits reviewer agent stdout lines as model-output events", async () => {
    const emittedEvents: unknown[] = [];
    agentGateway.invoke.mockResolvedValue({
      exitCode: 0,
      stdout: "Review found a missing assertion.\nRecommend changes before approval.\n",
    });
    const manager = new ReviewerProcessManager(
      goalStatusReader,
      goalReader,
      claimPolicy as any,
      { workerId: "worker_1" },
      reviewGoalController as any,
      agentGateway,
      telemetryClient,
    );

    await manager.processNext({
      agentId: "codex",
      maxRetries: 1,
      emit: (event) => emittedEvents.push(event),
    });

    expect(emittedEvents).toEqual([
      {
        daemon: "reviewer",
        status: "processing",
        goalId: "goal_1",
        attempt: 1,
        maxRetries: 1,
      },
      {
        daemon: "reviewer",
        status: "processing",
        source: "reviewer",
        category: "model-output",
        message: "Review found a missing assertion.",
        goalId: "goal_1",
      },
      {
        daemon: "reviewer",
        status: "processing",
        source: "reviewer",
        category: "model-output",
        message: "Recommend changes before approval.",
        goalId: "goal_1",
      },
      {
        daemon: "reviewer",
        status: "completed",
        goalId: "goal_1",
        attempt: 1,
        maxRetries: 1,
        exitCode: 0,
      },
    ]);
  });
});
