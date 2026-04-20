import { jest, describe, it, expect, beforeEach } from "@jest/globals";

jest.unstable_mockModule("node:child_process", () => ({
  execSync: jest.fn(),
  spawn: jest.fn(),
}));

jest.unstable_mockModule("../../../../../../src/presentation/cli/commands/work/shared/DaemonLoop.js", () => ({
  runDaemonLoop: jest.fn().mockResolvedValue(undefined),
}));

jest.unstable_mockModule("../../../../../../src/presentation/cli/commands/work/shared/GoalStatusQuery.js", () => ({
  queryGoalStatus: jest.fn().mockReturnValue("unknown"),
}));

jest.unstable_mockModule("../../../../../../src/presentation/cli/commands/work/shared/AgentSpawner.js", () => ({
  SUPPORTED_AGENTS: ["claude", "gemini"],
  spawnAgent: jest.fn().mockResolvedValue(0),
}));

jest.unstable_mockModule("../../../../../../src/presentation/cli/animations/GlimmerEffect.js", () => ({
  playGlimmer: jest.fn().mockResolvedValue(undefined),
}));

jest.unstable_mockModule("../../../../../../src/presentation/cli/animations/BrailleSpinner.js", () => ({
  startBrailleSpinner: jest.fn().mockReturnValue({ stop: jest.fn() }),
}));

const { execSync } = await import("node:child_process");
const { workReview, metadata } = await import("../../../../../../src/presentation/cli/commands/work/review/work.review.js");
const { runDaemonLoop } = await import("../../../../../../src/presentation/cli/commands/work/shared/DaemonLoop.js");
const { queryGoalStatus } = await import("../../../../../../src/presentation/cli/commands/work/shared/GoalStatusQuery.js");
const { spawnAgent } = await import("../../../../../../src/presentation/cli/commands/work/shared/AgentSpawner.js");
import type { DaemonCallbacks } from "../../../../../../src/presentation/cli/commands/work/shared/DaemonLoop.js";

const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;
const mockRunDaemonLoop = runDaemonLoop as jest.MockedFunction<typeof runDaemonLoop>;
const mockQueryGoalStatus = queryGoalStatus as jest.MockedFunction<typeof queryGoalStatus>;
const mockSpawnAgent = spawnAgent as jest.MockedFunction<typeof spawnAgent>;

describe("work.review", () => {
  const mockContainer = {} as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRunDaemonLoop.mockResolvedValue(undefined);
  });

  describe("metadata", () => {
    it("has category 'work'", () => {
      expect(metadata.category).toBe("work");
    });

    it("includes related commands", () => {
      expect(metadata.related).toContain("goal review");
      expect(metadata.related).toContain("goal approve");
      expect(metadata.related).toContain("goal reject");
      expect(metadata.related).toContain("work pause");
      expect(metadata.related).toContain("work resume");
    });

    it("requires --agent option", () => {
      const agentOption = metadata.requiredOptions?.find(o => o.flags.includes("--agent"));
      expect(agentOption).toBeDefined();
    });

    it("has examples for basic usage and custom poll interval", () => {
      expect(metadata.examples).toBeDefined();
      expect(metadata.examples!.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("workReview", () => {
    it("exits with error for unknown agent", async () => {
      const mockExit = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });

      await expect(
        workReview({ agent: "badagent" }, mockContainer),
      ).rejects.toThrow("exit");

      mockExit.mockRestore();
    });

    it("calls runDaemonLoop with correct config", async () => {
      await workReview({ agent: "claude" }, mockContainer);

      expect(mockRunDaemonLoop).toHaveBeenCalledWith(
        { agentId: "claude", pollIntervalS: 30, maxRetries: 3 },
        expect.any(Object),
        expect.objectContaining({
          queryGoals: expect.any(Function),
          spawnAgent: expect.any(Function),
          isGoalComplete: expect.any(Function),
          onGoalComplete: expect.any(Function),
          onGoalSkipped: expect.any(Function),
        }),
      );
    });

    it("respects custom poll interval and max retries", async () => {
      await workReview(
        { agent: "claude", pollInterval: "60", maxRetries: "5" },
        mockContainer,
      );

      expect(mockRunDaemonLoop).toHaveBeenCalledWith(
        { agentId: "claude", pollIntervalS: 60, maxRetries: 5 },
        expect.any(Object),
        expect.any(Object),
      );
    });
  });

  describe("callbacks", () => {
    let callbacks: DaemonCallbacks;

    beforeEach(async () => {
      await workReview({ agent: "claude" }, mockContainer);
      callbacks = mockRunDaemonLoop.mock.calls[0][2];
    });

    describe("queryGoals", () => {
      it("queries for submitted goals sorted by createdAt ascending", () => {
        const goals = [
          { goalId: "goal-2", objective: "Second", createdAt: "2026-04-20T14:00:00.000Z" },
          { goalId: "goal-1", objective: "First", createdAt: "2026-04-20T13:00:00.000Z" },
        ];
        mockExecSync.mockReturnValue(Buffer.from(JSON.stringify({ goals })));

        const result = callbacks.queryGoals();

        expect(mockExecSync).toHaveBeenCalledWith(
          "npx jumbo goals list --status submitted",
          expect.any(Object),
        );
        expect(result[0].goalId).toBe("goal-1");
        expect(result[1].goalId).toBe("goal-2");
      });

      it("returns empty array on subprocess failure", () => {
        mockExecSync.mockImplementation(() => { throw new Error("fail"); });
        const result = callbacks.queryGoals();
        expect(result).toEqual([]);
      });
    });

    describe("spawnAgent", () => {
      it("spawns agent with review prompt", async () => {
        await callbacks.spawnAgent("test-goal-id");

        expect(mockSpawnAgent).toHaveBeenCalledWith(
          "claude",
          expect.stringContaining("Run the Jumbo review workflow for goal test-goal-id"),
        );
        expect(mockSpawnAgent).toHaveBeenCalledWith(
          "claude",
          expect.stringContaining("jumbo goal review --id test-goal-id"),
        );
      });
    });

    describe("isGoalComplete", () => {
      it("returns true when goal status is approved", () => {
        mockQueryGoalStatus.mockReturnValue("approved");
        expect(callbacks.isGoalComplete("goal-1")).toBe(true);
      });

      it("returns true when goal status is rejected", () => {
        mockQueryGoalStatus.mockReturnValue("rejected");
        expect(callbacks.isGoalComplete("goal-1")).toBe(true);
      });

      it("returns false when goal status is still submitted", () => {
        mockQueryGoalStatus.mockReturnValue("submitted");
        expect(callbacks.isGoalComplete("goal-1")).toBe(false);
      });

      it("returns false when goal status is unknown", () => {
        mockQueryGoalStatus.mockReturnValue("unknown");
        expect(callbacks.isGoalComplete("goal-1")).toBe(false);
      });
    });

    describe("onGoalComplete", () => {
      it("queries goal status for outcome rendering", () => {
        mockQueryGoalStatus.mockReturnValue("approved");
        callbacks.onGoalComplete("goal-1", "Test objective", 1);
        expect(mockQueryGoalStatus).toHaveBeenCalledWith("goal-1");
      });
    });

    describe("onGoalSkipped", () => {
      it("queries final goal status for skip rendering", () => {
        mockQueryGoalStatus.mockReturnValue("submitted");
        callbacks.onGoalSkipped("goal-1", "not-complete", 3);
        expect(mockQueryGoalStatus).toHaveBeenCalledWith("goal-1");
      });
    });
  });
});
