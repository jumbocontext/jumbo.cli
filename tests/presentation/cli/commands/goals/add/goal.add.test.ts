/**
 * Tests for goal.add CLI command — non-interactive validation
 */

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { goalAdd } from "../../../../../../src/presentation/cli/commands/goals/add/goal.add.js";
import { IApplicationContainer } from "../../../../../../src/application/host/IApplicationContainer.js";
import { Renderer } from "../../../../../../src/presentation/cli/rendering/Renderer.js";

describe("goal.add command", () => {
  let mockAddGoalController: { handle: jest.Mock };
  let mockContainer: Partial<IApplicationContainer>;
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;
  let processExitSpy: jest.SpiedFunction<typeof process.exit>;

  beforeEach(() => {
    Renderer.configure({ format: "text", verbosity: "normal" });

    mockAddGoalController = {
      handle: jest.fn<() => Promise<any>>().mockResolvedValue({
        goalId: "goal_abc123",
      }),
    };

    mockContainer = {
      addGoalController: mockAddGoalController as any,
    };

    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    processExitSpy = jest.spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`process.exit called with code ${code}`);
    });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
    Renderer.reset();
  });

  it("should succeed with all required flags", async () => {
    await goalAdd(
      {
        title: "My Goal",
        objective: "Implement feature X",
        criteria: ["Tests pass"],
      },
      mockContainer as IApplicationContainer
    );

    expect(mockAddGoalController.handle).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "My Goal",
        objective: "Implement feature X",
        successCriteria: ["Tests pass"],
      })
    );
  });

  it("should exit with error when --title is missing in non-interactive mode", async () => {
    await expect(
      goalAdd(
        { objective: "Implement feature X", criteria: ["Tests pass"] },
        mockContainer as IApplicationContainer
      )
    ).rejects.toThrow("process.exit called with code 1");

    const errorOutput = consoleErrorSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(errorOutput).toContain("--title is required");
  });

  it("should exit with error when --objective is missing in non-interactive mode", async () => {
    await expect(
      goalAdd(
        { title: "My Goal", criteria: ["Tests pass"] },
        mockContainer as IApplicationContainer
      )
    ).rejects.toThrow("process.exit called with code 1");

    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it("should exit with error when --criteria is missing in non-interactive mode", async () => {
    await expect(
      goalAdd(
        { title: "My Goal", objective: "Implement feature X" },
        mockContainer as IApplicationContainer
      )
    ).rejects.toThrow("process.exit called with code 1");

    const errorOutput = consoleErrorSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(errorOutput).toContain("--criteria is required");
  });

  it("should pass branch and worktree to controller", async () => {
    await goalAdd(
      {
        title: "Multi-agent Goal",
        objective: "Implement feature X",
        criteria: ["Tests pass"],
        branch: "feature/goal-123",
        worktree: "/worktrees/goal-123",
      },
      mockContainer as IApplicationContainer
    );

    expect(mockAddGoalController.handle).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Multi-agent Goal",
        objective: "Implement feature X",
        successCriteria: ["Tests pass"],
        branch: "feature/goal-123",
        worktree: "/worktrees/goal-123",
      })
    );
  });

  it("should exit with error when --criteria is empty array in non-interactive mode", async () => {
    await expect(
      goalAdd(
        { title: "My Goal", objective: "Implement feature X", criteria: [] },
        mockContainer as IApplicationContainer
      )
    ).rejects.toThrow("process.exit called with code 1");

    const errorOutput = consoleErrorSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(errorOutput).toContain("--criteria is required");
  });
});
