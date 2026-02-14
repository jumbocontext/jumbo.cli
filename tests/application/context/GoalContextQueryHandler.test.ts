import { describe, it, expect, beforeEach } from "@jest/globals";
import { GoalContextQueryHandler } from "../../../src/application/context/GoalContextQueryHandler.js";
import { IGoalContextAssembler } from "../../../src/application/context/IGoalContextAssembler.js";
import { GoalContext } from "../../../src/application/context/GoalContext.js";
import { GoalView } from "../../../src/application/context/goals/GoalView.js";

/**
 * Tests for GoalContextQueryHandler
 *
 * Tests cover:
 * - Delegation to IGoalContextAssembler
 * - Error handling when goal not found
 */

// Mock implementation of IGoalContextAssembler
class MockGoalContextAssembler implements IGoalContextAssembler {
  private contexts: Map<string, GoalContext> = new Map();

  async assembleContextForGoal(goalId: string): Promise<GoalContext | null> {
    return this.contexts.get(goalId) || null;
  }

  setContext(goalId: string, context: GoalContext): void {
    this.contexts.set(goalId, context);
  }

  clear(): void {
    this.contexts.clear();
  }
}

describe("GoalContextQueryHandler", () => {
  let mockAssembler: MockGoalContextAssembler;
  let handler: GoalContextQueryHandler;

  beforeEach(() => {
    mockAssembler = new MockGoalContextAssembler();
    handler = new GoalContextQueryHandler(mockAssembler);
  });

  describe("execute", () => {
    it("should delegate to assembler and return goal context", async () => {
      // Arrange
      const goal: GoalView = {
        goalId: "goal_123",
        objective: "Implement JWT authentication",
        successCriteria: ["Token generation", "Middleware validates tokens"],
        scopeIn: ["UserController", "AuthMiddleware"],
        scopeOut: ["AdminRoutes"],
        status: "doing",
        version: 1,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
        progress: [],
      };

      const expectedContext: GoalContext = {
        goal,
        invariants: [],
        guidelines: [],
        components: [],
        dependencies: [],
        decisions: [],
        architecture: null,
      };

      mockAssembler.setContext("goal_123", expectedContext);

      // Act
      const result = await handler.execute("goal_123");

      // Assert
      expect(result).toEqual(expectedContext);
    });

    it("should throw error when goal not found", async () => {
      // Act & Assert
      await expect(handler.execute("nonexistent_goal")).rejects.toThrow(
        "Goal not found: nonexistent_goal"
      );
    });
  });
});
