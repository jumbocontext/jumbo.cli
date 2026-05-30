import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { CodifierProcessManager } from "../../../../../src/application/context/goals/codify/CodifierProcessManager";
import { GoalStatus } from "../../../../../src/domain/goals/Constants";
import { GoalView } from "../../../../../src/application/context/goals/GoalView";

function goal(overrides: Partial<GoalView> = {}): GoalView {
  return {
    goalId: "goal_1",
    title: "Test goal",
    objective: "Test objective",
    successCriteria: [],
    scopeIn: [],
    scopeOut: [],
    status: GoalStatus.QUALIFIED,
    version: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    progress: [],
    ...overrides,
  };
}

describe("CodifierProcessManager", () => {
  let goalStatusReader: { findByStatus: jest.Mock; findAll: jest.Mock };
  let goalReader: { findById: jest.Mock };
  let claimPolicy: { canClaim: jest.Mock };
  let workerIdentityReader: { workerId: string };
  let codifyGoalController: { handle: jest.Mock };
  let agentGateway: { invoke: jest.Mock };
  let telemetryClient: { track: jest.Mock; flush: jest.Mock; shutdown: jest.Mock };

  function manager(): CodifierProcessManager {
    return new CodifierProcessManager(
      goalStatusReader,
      goalReader,
      claimPolicy as any,
      workerIdentityReader,
      codifyGoalController as any,
      agentGateway,
      telemetryClient,
    );
  }

  beforeEach(() => {
    goalStatusReader = {
      findByStatus: jest.fn(),
      findAll: jest.fn(),
    };
    goalReader = {
      findById: jest.fn(),
    };
    claimPolicy = {
      canClaim: jest.fn().mockReturnValue({ allowed: true }),
    };
    workerIdentityReader = {
      workerId: "worker_1",
    };
    codifyGoalController = {
      handle: jest.fn().mockResolvedValue({}),
    };
    agentGateway = {
      invoke: jest.fn().mockResolvedValue({ exitCode: 0 }),
    };
    telemetryClient = {
      track: jest.fn(),
      flush: jest.fn(),
      shutdown: jest.fn(),
    };
  });

  it("selects approved goals that the current worker can claim ordered by creation time", async () => {
    const newer = goal({ goalId: "goal_new", createdAt: "2026-01-02T00:00:00.000Z" });
    const older = goal({ goalId: "goal_old", createdAt: "2026-01-01T00:00:00.000Z" });
    const blocked = goal({ goalId: "goal_claimed", createdAt: "2025-12-31T00:00:00.000Z" });
    goalStatusReader.findByStatus.mockResolvedValue([newer, blocked, older]);
    claimPolicy.canClaim.mockImplementation((goalId: string) =>
      goalId === "goal_claimed" ? { allowed: false } : { allowed: true },
    );

    await expect(manager().selectEligibleGoals()).resolves.toEqual([older, newer]);
    expect(goalStatusReader.findByStatus).toHaveBeenCalledWith(GoalStatus.QUALIFIED);
    expect(claimPolicy.canClaim).toHaveBeenCalledWith("goal_old", "worker_1");
  });

  it("starts codification, invokes the agent with codify and close instructions, and completes when the goal is done", async () => {
    goalStatusReader.findByStatus.mockResolvedValue([goal()]);
    goalReader.findById.mockResolvedValue(goal({ status: GoalStatus.DONE }));
    const events: unknown[] = [];

    const result = await manager().processNext({
      agentId: "codex",
      maxRetries: 3,
      emit: (event) => events.push(event),
    });

    expect(result).toEqual({ status: "completed", goalId: "goal_1", attempts: 1 });
    expect(codifyGoalController.handle).toHaveBeenCalledWith({ goalId: "goal_1" });
    expect(agentGateway.invoke).toHaveBeenCalledWith({
      agentId: "codex",
      prompt: expect.stringContaining("jumbo goal codify --id goal_1"),
    });
    expect(agentGateway.invoke.mock.calls[0][0].prompt).toContain("jumbo goal close --id goal_1");
    expect(events).toContainEqual(expect.objectContaining({
      status: "processing",
      source: "codifier",
      category: "work-started",
      message: "codifying goal",
      goalId: "goal_1",
    }));
    expect(events).toContainEqual(expect.objectContaining({
      status: "completed",
      source: "codifier",
      category: "completed",
      message: "goal codified",
      goalId: "goal_1",
    }));
    expect(telemetryClient.track).toHaveBeenCalledWith(
      "codifier_process_completed",
      expect.objectContaining({ daemon: "codifier", status: "completed", goalId: "goal_1" }),
    );
  });

  it("retries agent invocation until completion verification succeeds", async () => {
    goalStatusReader.findByStatus.mockResolvedValue([goal()]);
    goalReader.findById
      .mockResolvedValueOnce(goal({ status: GoalStatus.CODIFYING }))
      .mockResolvedValueOnce(goal({ status: GoalStatus.DONE }));

    const result = await manager().processNext({ agentId: "codex", maxRetries: 2 });

    expect(result).toEqual({ status: "completed", goalId: "goal_1", attempts: 2 });
    expect(codifyGoalController.handle).toHaveBeenCalledTimes(1);
    expect(agentGateway.invoke).toHaveBeenCalledTimes(2);
  });

  it("reports exhausted when the goal never reaches done", async () => {
    goalStatusReader.findByStatus.mockResolvedValue([goal()]);
    goalReader.findById.mockResolvedValue(goal({ status: GoalStatus.CODIFYING }));
    const events: unknown[] = [];

    const result = await manager().processNext({
      agentId: "codex",
      maxRetries: 2,
      emit: (event) => events.push(event),
    });

    expect(result).toEqual({ status: "exhausted", goalId: "goal_1", attempts: 2 });
    expect(agentGateway.invoke).toHaveBeenCalledTimes(2);
    expect(events).toContainEqual(expect.objectContaining({
      status: "skipped",
      source: "codifier",
      category: "skipped",
      message: "goal not codified after agent attempt",
      attempt: 1,
    }));
    expect(events).toContainEqual(expect.objectContaining({
      status: "exhausted",
      source: "codifier",
      category: "exhausted",
      message: "codification attempts exhausted",
      attempt: 2,
    }));
    expect(telemetryClient.track).toHaveBeenCalledWith(
      "codifier_process_completed",
      expect.objectContaining({ status: "exhausted", attempts: 2, goalId: "goal_1" }),
    );
  });

  it("returns idle when no eligible goals exist", async () => {
    goalStatusReader.findByStatus.mockResolvedValue([]);
    const events: unknown[] = [];

    const result = await manager().processNext({
      agentId: "codex",
      maxRetries: 1,
      emit: (event) => events.push(event),
    });

    expect(result).toEqual({ status: "idle", attempts: 0 });
    expect(events).toEqual([
      {
        daemon: "codifier",
        status: "idle",
        source: "codifier",
        category: "waiting",
        message: "awaiting approved goals",
      },
    ]);
    expect(codifyGoalController.handle).not.toHaveBeenCalled();
    expect(agentGateway.invoke).not.toHaveBeenCalled();
  });

  it("emits failure telemetry when codification cannot acquire the goal", async () => {
    goalStatusReader.findByStatus.mockResolvedValue([goal()]);
    codifyGoalController.handle.mockRejectedValue(new Error("Goal is claimed by another worker"));
    const events: unknown[] = [];

    const result = await manager().processNext({
      agentId: "codex",
      maxRetries: 1,
      emit: (event) => events.push(event),
    });

    expect(result).toEqual({ status: "failed", goalId: "goal_1", attempts: 0 });
    expect(agentGateway.invoke).not.toHaveBeenCalled();
    expect(events).toContainEqual(expect.objectContaining({
      daemon: "codifier",
      status: "failed",
      source: "codifier",
      category: "failed",
      message: "codification failed",
      goalId: "goal_1",
      errorType: "Error",
      errorMessage: "Goal is claimed by another worker",
    }));
    expect(telemetryClient.track).toHaveBeenCalledWith(
      "codifier_process_completed",
      expect.objectContaining({
        status: "failed",
        goalId: "goal_1",
        errorType: "Error",
        errorMessage: "Goal is claimed by another worker",
      }),
    );
  });

  it("caps codifier failure event and telemetry error messages", async () => {
    goalStatusReader.findByStatus.mockResolvedValue([goal()]);
    codifyGoalController.handle.mockRejectedValue(new Error(`${"x".repeat(20_000)}codifier tail`));
    const events: any[] = [];

    await manager().processNext({
      agentId: "codex",
      maxRetries: 1,
      emit: (event) => events.push(event),
    });

    const failedEvent = events.find((event) => event.status === "failed");
    expect(failedEvent.errorMessage).toHaveLength(2_048);
    expect(failedEvent.errorMessage).toContain("codifier tail");
    expect(telemetryClient.track).toHaveBeenCalledWith(
      "codifier_process_completed",
      expect.objectContaining({
        errorMessage: expect.stringContaining("codifier tail"),
      }),
    );
    const telemetryProperties = telemetryClient.track.mock.calls[0][1] as { errorMessage: string };
    expect(telemetryProperties.errorMessage).toHaveLength(2_048);
  });
});
