/**
 * Tests for goal.codify CLI command
 */

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { goalCodify } from "../../../../../../src/presentation/cli/commands/goals/codify/goal.codify.js";
import { IApplicationContainer } from "../../../../../../src/application/host/IApplicationContainer.js";
import { Renderer } from "../../../../../../src/presentation/cli/rendering/Renderer.js";

describe("goal.codify command", () => {
  let mockCodifyGoalController: { handle: jest.Mock };
  let mockContainer: Partial<IApplicationContainer>;
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;
  let processExitSpy: jest.SpiedFunction<typeof process.exit>;

  beforeEach(() => {
    // Reset renderer to text mode for testing
    Renderer.configure({ format: "text", verbosity: "normal" });

    // Create mock instances
    mockCodifyGoalController = {
      handle: jest.fn<() => Promise<any>>().mockResolvedValue({
        goalContextView: {
          goal: {
            goalId: "goal_123",
            objective: "Implement authentication",
            successCriteria: [],
            scopeIn: [],
            scopeOut: [],
            status: "codifying",
            version: 8,
            createdAt: "2025-01-01T00:00:00Z",
            updatedAt: "2025-01-01T00:00:00Z",
            progress: [],
          },
          context: {
            components: [],
            dependencies: [],
            decisions: [],
            invariants: [],
            guidelines: [],
            architecture: null,
          },
        },
      }),
    };

    // Create mock container
    mockContainer = {
      codifyGoalController: mockCodifyGoalController as any,
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

  it("should call codifyGoalController.handle with goalId", async () => {
    await goalCodify(
      { id: "goal_123" },
      mockContainer as IApplicationContainer
    );

    expect(mockCodifyGoalController.handle).toHaveBeenCalledWith({
      goalId: "goal_123",
    });
  });

  it("should render success output", async () => {
    await goalCodify(
      { id: "goal_123" },
      mockContainer as IApplicationContainer
    );

    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it("should handle errors", async () => {
    mockCodifyGoalController.handle.mockRejectedValue(
      new Error("Cannot codify goal in defined status. Goal must be in approved status.")
    );

    await expect(
      goalCodify({ id: "goal_123" }, mockContainer as IApplicationContainer)
    ).rejects.toThrow("process.exit called with code 1");

    const errorOutput = consoleErrorSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(errorOutput).toContain("Cannot codify goal");
  });
});
