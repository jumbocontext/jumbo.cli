/**
 * Tests for goal.refine CLI command
 *
 * Tests the three-mode behavior:
 * 1. Default mode (no flags): Display goal details + LLM prompt, no status change
 * 2. --approve mode: Display goal details + LLM prompt + transition to refined status
 * 3. --interactive mode: Interactive relation flow + transition to refined status
 */

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { goalRefine } from "../../../../../../src/presentation/cli/commands/goals/refine/goal.refine.js";
import { IApplicationContainer } from "../../../../../../src/application/host/IApplicationContainer.js";
import { GoalView } from "../../../../../../src/application/goals/GoalView.js";
import { Renderer } from "../../../../../../src/presentation/cli/rendering/Renderer.js";
import { GoalStatus, GoalEventType } from "../../../../../../src/domain/goals/Constants.js";
import { BaseEvent } from "../../../../../../src/domain/BaseEvent.js";
import { AppendResult } from "../../../../../../src/application/persistence/IEventStore.js";
import { IEventHandler } from "../../../../../../src/application/messaging/IEventHandler.js";
import { IGoalContextReader } from "../../../../../../src/application/goals/get-context/IGoalContextReader.js";
import { IGoalRefineEventWriter } from "../../../../../../src/application/goals/refine/IGoalRefineEventWriter.js";
import { IGoalRefineEventReader } from "../../../../../../src/application/goals/refine/IGoalRefineEventReader.js";
import { IGoalRefinedProjector } from "../../../../../../src/application/goals/refine/IGoalRefinedProjector.js";
import { IGoalRefineReader } from "../../../../../../src/application/goals/refine/IGoalRefineReader.js";
import { IEventBus } from "../../../../../../src/application/messaging/IEventBus.js";
import { GoalRefinedEvent } from "../../../../../../src/domain/goals/refine/GoalRefinedEvent.js";

/**
 * Mock implementations for test dependencies
 */

class MockGoalContextReader implements IGoalContextReader {
  mockFindById: jest.Mock<(goalId: string) => Promise<GoalView | null>> = jest.fn();

  async findById(goalId: string): Promise<GoalView | null> {
    return this.mockFindById(goalId);
  }
}

class MockGoalRefinedEventStore implements IGoalRefineEventWriter, IGoalRefineEventReader {
  events: BaseEvent[] = [];
  mockAppend: jest.Mock<(event: BaseEvent & Record<string, any>) => Promise<AppendResult>> = jest.fn();
  mockReadStream: jest.Mock<(streamId: string) => Promise<BaseEvent[]>> = jest.fn();

  async append(event: BaseEvent & Record<string, any>): Promise<AppendResult> {
    return this.mockAppend(event);
  }

  async readStream(streamId: string): Promise<BaseEvent[]> {
    return this.mockReadStream(streamId);
  }
}

class MockGoalRefinedProjector implements IGoalRefinedProjector, IGoalRefineReader {
  mockApplyGoalRefined: jest.Mock<(event: GoalRefinedEvent) => Promise<void>> = jest.fn();
  mockFindById: jest.Mock<(goalId: string) => Promise<GoalView | null>> = jest.fn();

  async applyGoalRefined(event: GoalRefinedEvent): Promise<void> {
    return this.mockApplyGoalRefined(event);
  }

  async findById(goalId: string): Promise<GoalView | null> {
    return this.mockFindById(goalId);
  }
}

class MockEventBus implements IEventBus {
  publishedEvents: BaseEvent[] = [];
  handlers: Map<string, IEventHandler[]> = new Map();

  subscribe(eventType: string, handler: IEventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  async publish(event: BaseEvent): Promise<void> {
    this.publishedEvents.push(event);
    const handlers = this.handlers.get(event.type) || [];
    for (const handler of handlers) {
      await handler.handle(event);
    }
  }
}

describe("goal.refine command", () => {
  let mockGoalContextReader: MockGoalContextReader;
  let mockGoalRefinedEventStore: MockGoalRefinedEventStore;
  let mockGoalRefinedProjector: MockGoalRefinedProjector;
  let mockEventBus: MockEventBus;
  let mockContainer: Partial<IApplicationContainer>;
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;
  let processExitSpy: jest.SpiedFunction<typeof process.exit>;

  const mockTodoGoalView: GoalView = {
    goalId: "goal_123",
    objective: "Implement user authentication",
    successCriteria: ["Users can log in", "Sessions are persisted"],
    scopeIn: ["Login form", "Session management"],
    scopeOut: ["Password reset", "Social login"],
    
    status: GoalStatus.TODO,
    version: 1,
    createdAt: "2025-01-01T10:00:00Z",
    updatedAt: "2025-01-01T10:00:00Z",
    progress: [],
  };

  const mockRefinedGoalView: GoalView = {
    ...mockTodoGoalView,
    status: GoalStatus.REFINED,
    version: 2,
    updatedAt: "2025-01-01T11:00:00Z",
  };

  beforeEach(() => {
    // Reset renderer to text mode for testing
    Renderer.configure({ format: "text", verbosity: "normal" });

    // Create mock instances
    mockGoalContextReader = new MockGoalContextReader();
    mockGoalRefinedEventStore = new MockGoalRefinedEventStore();
    mockGoalRefinedProjector = new MockGoalRefinedProjector();
    mockEventBus = new MockEventBus();

    // Set up default mock behaviors
    mockGoalRefinedEventStore.mockAppend.mockResolvedValue({ nextSeq: 2 });
    mockGoalRefinedEventStore.mockReadStream.mockResolvedValue([
      {
        type: GoalEventType.ADDED,
        aggregateId: "goal_123",
        version: 1,
        timestamp: "2025-01-01T10:00:00Z",
        payload: {
          objective: "Implement user authentication",
          successCriteria: ["Users can log in", "Sessions are persisted"],
          scopeIn: ["Login form", "Session management"],
          scopeOut: ["Password reset", "Social login"],
          
          status: GoalStatus.TODO,
        },
      },
    ]);
    mockGoalRefinedProjector.mockApplyGoalRefined.mockResolvedValue(undefined);
    mockGoalRefinedProjector.mockFindById.mockResolvedValue(mockRefinedGoalView);

    // Create mock container
    mockContainer = {
      goalContextReader: mockGoalContextReader,
      goalRefinedEventStore: mockGoalRefinedEventStore,
      goalRefinedProjector: mockGoalRefinedProjector,
      eventBus: mockEventBus,
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

  describe("default mode (no flags)", () => {
    it("should display goal details without changing status", async () => {
      mockGoalContextReader.mockFindById.mockResolvedValue(mockTodoGoalView);

      await goalRefine(
        { goalId: "goal_123" },
        mockContainer as IApplicationContainer
      );

      // Verify goal was fetched
      expect(mockGoalContextReader.mockFindById).toHaveBeenCalledWith("goal_123");

      // Verify no state transition occurred (no event append)
      expect(mockGoalRefinedEventStore.mockAppend).not.toHaveBeenCalled();

      // Verify output includes goal details and LLM instructions
      expect(consoleLogSpy).toHaveBeenCalled();
      const allOutput = consoleLogSpy.mock.calls.map((c) => c.join(" ")).join("\n");
      expect(allOutput).toContain("Goal ID:");
      expect(allOutput).toContain("goal_123");
      expect(allOutput).toContain("@LLM:");
      expect(allOutput).toContain("jumbo goal refine --goal-id goal_123 --approve");
    });

    it("should display success criteria when present", async () => {
      mockGoalContextReader.mockFindById.mockResolvedValue(mockTodoGoalView);

      await goalRefine(
        { goalId: "goal_123" },
        mockContainer as IApplicationContainer
      );

      const allOutput = consoleLogSpy.mock.calls.map((c) => c.join(" ")).join("\n");
      expect(allOutput).toContain("Success Criteria");
      expect(allOutput).toContain("Users can log in");
    });

    it("should display scope in and scope out when present", async () => {
      mockGoalContextReader.mockFindById.mockResolvedValue(mockTodoGoalView);

      await goalRefine(
        { goalId: "goal_123" },
        mockContainer as IApplicationContainer
      );

      const allOutput = consoleLogSpy.mock.calls.map((c) => c.join(" ")).join("\n");
      expect(allOutput).toContain("Scope In");
      expect(allOutput).toContain("Login form");
      expect(allOutput).toContain("Scope Out");
      expect(allOutput).toContain("Password reset");
    });

    it("should display LLM refinement prompt with entity exploration commands", async () => {
      mockGoalContextReader.mockFindById.mockResolvedValue(mockTodoGoalView);

      await goalRefine(
        { goalId: "goal_123" },
        mockContainer as IApplicationContainer
      );

      const allOutput = consoleLogSpy.mock.calls.map((c) => c.join(" ")).join("\n");
      expect(allOutput).toContain("jumbo invariants list");
      expect(allOutput).toContain("jumbo guidelines list");
      expect(allOutput).toContain("jumbo decisions list");
      expect(allOutput).toContain("jumbo components list");
    });
  });

  describe("--approve mode", () => {
    it("should transition goal status from to-do to refined", async () => {
      mockGoalContextReader.mockFindById.mockResolvedValue(mockTodoGoalView);

      await goalRefine(
        { goalId: "goal_123", approve: true },
        mockContainer as IApplicationContainer
      );

      // Verify goal was fetched
      expect(mockGoalContextReader.mockFindById).toHaveBeenCalledWith("goal_123");

      // Verify state transition occurred
      expect(mockGoalRefinedEventStore.mockAppend).toHaveBeenCalledTimes(1);

      // Verify event was published to bus
      expect(mockEventBus.publishedEvents.length).toBe(1);

      // Verify success message
      const allOutput = consoleLogSpy.mock.calls.map((c) => c.join(" ")).join("\n");
      expect(allOutput).toContain("Goal refined");
      expect(allOutput).toContain("jumbo goal start");
    });

    it("should display goal details before approving", async () => {
      mockGoalContextReader.mockFindById.mockResolvedValue(mockTodoGoalView);

      await goalRefine(
        { goalId: "goal_123", approve: true },
        mockContainer as IApplicationContainer
      );

      const allOutput = consoleLogSpy.mock.calls.map((c) => c.join(" ")).join("\n");
      expect(allOutput).toContain("Goal Details");
      expect(allOutput).toContain("Objective");
      expect(allOutput).toContain("Implement user authentication");
    });

    it("should display LLM refinement prompt before approving", async () => {
      mockGoalContextReader.mockFindById.mockResolvedValue(mockTodoGoalView);

      await goalRefine(
        { goalId: "goal_123", approve: true },
        mockContainer as IApplicationContainer
      );

      const allOutput = consoleLogSpy.mock.calls.map((c) => c.join(" ")).join("\n");
      expect(allOutput).toContain("@LLM: CRITICAL - Goal refinement requires comprehensive relation registration");
      expect(allOutput).toContain("@LLM: Goal is now refined and ready to start");
    });

    it("should output JSON format when configured", async () => {
      Renderer.configure({ format: "json", verbosity: "normal" });
      mockGoalContextReader.mockFindById.mockResolvedValue(mockTodoGoalView);

      await goalRefine(
        { goalId: "goal_123", approve: true },
        mockContainer as IApplicationContainer
      );

      expect(mockGoalRefinedEventStore.mockAppend).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should exit with error when goal not found", async () => {
      mockGoalContextReader.mockFindById.mockResolvedValue(null);

      await expect(
        goalRefine({ goalId: "nonexistent" }, mockContainer as IApplicationContainer)
      ).rejects.toThrow("process.exit called with code 1");

      // Error messages go to console.error
      const errorOutput = consoleErrorSpy.mock.calls.map((c) => c.join(" ")).join("\n");
      expect(errorOutput).toContain("Goal not found");
    });

    it("should exit with error when event store fails during approve", async () => {
      mockGoalContextReader.mockFindById.mockResolvedValue(mockTodoGoalView);
      mockGoalRefinedEventStore.mockAppend.mockRejectedValue(new Error("Event store failure"));

      await expect(
        goalRefine({ goalId: "goal_123", approve: true }, mockContainer as IApplicationContainer)
      ).rejects.toThrow("process.exit called with code 1");

      // Error messages go to console.error
      const errorOutput = consoleErrorSpy.mock.calls.map((c) => c.join(" ")).join("\n");
      expect(errorOutput).toContain("Failed to refine goal");
    });

    it("should handle goal already in refined status during approve", async () => {
      mockGoalContextReader.mockFindById.mockResolvedValue(mockRefinedGoalView);
      mockGoalRefinedEventStore.mockReadStream.mockResolvedValue([
        {
          type: GoalEventType.ADDED,
          aggregateId: "goal_123",
          version: 1,
          timestamp: "2025-01-01T10:00:00Z",
          payload: { objective: "Test", status: GoalStatus.TODO },
        },
        {
          type: GoalEventType.REFINED,
          aggregateId: "goal_123",
          version: 2,
          timestamp: "2025-01-01T11:00:00Z",
          payload: { status: GoalStatus.REFINED },
        },
      ]);

      await expect(
        goalRefine({ goalId: "goal_123", approve: true }, mockContainer as IApplicationContainer)
      ).rejects.toThrow("process.exit called with code 1");

      // Error messages go to console.error
      const errorOutput = consoleErrorSpy.mock.calls.map((c) => c.join(" ")).join("\n");
      expect(errorOutput).toContain("Failed to refine goal");
    });
  });

  describe("goal without optional fields", () => {
    it("should handle goal with empty successCriteria", async () => {
      const goalWithoutCriteria: GoalView = {
        ...mockTodoGoalView,
        successCriteria: [],
      };
      mockGoalContextReader.mockFindById.mockResolvedValue(goalWithoutCriteria);

      await goalRefine(
        { goalId: "goal_123" },
        mockContainer as IApplicationContainer
      );

      expect(consoleLogSpy).toHaveBeenCalled();
      // Should not throw and should still display goal details
      const allOutput = consoleLogSpy.mock.calls.map((c) => c.join(" ")).join("\n");
      expect(allOutput).toContain("Goal ID:");
    });

    it("should handle goal with empty scopeIn and scopeOut", async () => {
      const goalWithoutScope: GoalView = {
        ...mockTodoGoalView,
        scopeIn: [],
        scopeOut: [],
      };
      mockGoalContextReader.mockFindById.mockResolvedValue(goalWithoutScope);

      await goalRefine(
        { goalId: "goal_123" },
        mockContainer as IApplicationContainer
      );

      expect(consoleLogSpy).toHaveBeenCalled();
      const allOutput = consoleLogSpy.mock.calls.map((c) => c.join(" ")).join("\n");
      expect(allOutput).toContain("Goal ID:");
      // Scope sections should not appear when empty
      expect(allOutput).not.toContain("Scope In");
      expect(allOutput).not.toContain("Scope Out");
    });
  });
});
