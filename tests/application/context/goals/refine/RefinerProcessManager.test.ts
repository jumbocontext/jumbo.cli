import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { RefinerProcessManager } from "../../../../../src/application/context/goals/refine/RefinerProcessManager";
import { GoalStatus } from "../../../../../src/domain/goals/Constants";

describe("RefinerProcessManager", () => {
  const goal = {
    goalId: "goal_1",
    objective: "Refine objective",
    createdAt: "2026-01-01T00:00:00.000Z",
    status: GoalStatus.TODO,
  } as any;
  let goalStatusReader: { findByStatus: jest.Mock; findAll: jest.Mock };
  let goalReader: { findById: jest.Mock };
  let claimPolicy: { canClaim: jest.Mock };
  let refineGoalController: { handle: jest.Mock };
  let agentGateway: { invoke: jest.Mock };
  let telemetryClient: { track: jest.Mock; flush: jest.Mock; shutdown: jest.Mock };

  beforeEach(() => {
    goalStatusReader = { findByStatus: jest.fn().mockResolvedValue([goal]), findAll: jest.fn() };
    goalReader = { findById: jest.fn().mockResolvedValue({ ...goal, status: GoalStatus.REFINED }) };
    claimPolicy = { canClaim: jest.fn().mockReturnValue({ allowed: true }) };
    refineGoalController = { handle: jest.fn().mockResolvedValue({}) };
    agentGateway = { invoke: jest.fn().mockResolvedValue({ exitCode: 0 }) };
    telemetryClient = { track: jest.fn(), flush: jest.fn(), shutdown: jest.fn() };
  });

  it("preserves legacy defined-goal selection and refinement prompt semantics", async () => {
    const manager = new RefinerProcessManager(
      goalStatusReader,
      goalReader,
      claimPolicy as any,
      { workerId: "worker_1" },
      refineGoalController as any,
      agentGateway,
      telemetryClient,
    );

    await expect(manager.processNext({ agentId: "codex", maxRetries: 1 })).resolves.toEqual({
      status: "completed",
      goalId: "goal_1",
      attempts: 1,
    });
    expect(goalStatusReader.findByStatus).toHaveBeenCalledWith(GoalStatus.TODO);
    expect(refineGoalController.handle).toHaveBeenCalledWith({ goalId: "goal_1" });
    expect(agentGateway.invoke).toHaveBeenCalledWith({
      agentId: "codex",
      prompt: "Run the Jumbo refinement workflow for goal goal_1. Execute: jumbo goal refine --id goal_1",
    });
  });

  it("includes agent stderr in skipped and exhausted events when invocation fails", async () => {
    goalReader.findById.mockResolvedValue({ ...goal, status: GoalStatus.TODO });
    agentGateway.invoke.mockResolvedValue({
      exitCode: 1,
      stderr: "Error loading configuration: config profile `prompt` not found\n",
    });
    const events: any[] = [];
    const manager = new RefinerProcessManager(
      goalStatusReader,
      goalReader,
      claimPolicy as any,
      { workerId: "worker_1" },
      refineGoalController as any,
      agentGateway,
      telemetryClient,
    );

    await expect(manager.processNext({
      agentId: "codex",
      maxRetries: 2,
      emit: (event) => events.push(event),
    })).resolves.toEqual({
      status: "exhausted",
      goalId: "goal_1",
      attempts: 2,
    });

    expect(events).toEqual([
      expect.objectContaining({ status: "processing", attempt: 1 }),
      expect.objectContaining({
        status: "skipped",
        attempt: 1,
        errorMessage: "Error loading configuration: config profile `prompt` not found",
      }),
      expect.objectContaining({ status: "processing", attempt: 2 }),
      expect.objectContaining({
        status: "exhausted",
        attempt: 2,
        errorMessage: "Error loading configuration: config profile `prompt` not found",
      }),
    ]);
  });
});
