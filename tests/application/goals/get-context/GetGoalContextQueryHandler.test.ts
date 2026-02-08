import { describe, it, expect, beforeEach } from "@jest/globals";
import { GetGoalContextQueryHandler } from "../../../../src/application/goals/get-context/GetGoalContextQueryHandler.js";
import { IGoalContextReader } from "../../../../src/application/goals/get-context/IGoalContextReader.js";
import { IInvariantContextReader } from "../../../../src/application/goals/get-context/IInvariantContextReader.js";
import { IGuidelineContextReader } from "../../../../src/application/goals/get-context/IGuidelineContextReader.js";
import { IComponentContextReader } from "../../../../src/application/goals/get-context/IComponentContextReader.js";
import { IDependencyContextReader } from "../../../../src/application/goals/get-context/IDependencyContextReader.js";
import { GoalView } from "../../../../src/application/goals/GoalView.js";
import { InvariantView } from "../../../../src/application/invariants/InvariantView.js";
import { GuidelineView } from "../../../../src/application/guidelines/GuidelineView.js";
import { ComponentView } from "../../../../src/application/components/ComponentView.js";

/**
 * Tests for GetGoalContextQueryHandler
 *
 * Tests cover:
 * - Basic goal retrieval
 * - Embedded context preference (interactive creation)
 * - Fallback behavior (legacy goals)
 * - Mapping of embedded fields to context views
 */

// Mock implementation of IGoalContextReader
class MockGoalContextReader implements IGoalContextReader {
  private goals: Map<string, GoalView> = new Map();

  async findById(goalId: string): Promise<GoalView | null> {
    return this.goals.get(goalId) || null;
  }

  addGoal(goal: GoalView): void {
    this.goals.set(goal.goalId, goal);
  }

  clear(): void {
    this.goals.clear();
  }
}

// Mock implementation of IInvariantContextReader
class MockInvariantContextReader implements IInvariantContextReader {
  private invariants: InvariantView[] = [];

  async findAll(): Promise<InvariantView[]> {
    return this.invariants;
  }

  setInvariants(invariants: InvariantView[]): void {
    this.invariants = invariants;
  }
}

// Mock implementation of IGuidelineContextReader
class MockGuidelineContextReader implements IGuidelineContextReader {
  private guidelines: GuidelineView[] = [];

  async findAll(): Promise<GuidelineView[]> {
    return this.guidelines;
  }

  setGuidelines(guidelines: GuidelineView[]): void {
    this.guidelines = guidelines;
  }
}

// Mock implementation of IComponentContextReader
class MockComponentContextReader implements IComponentContextReader {
  private components: ComponentView[] = [];

  async findAll(): Promise<ComponentView[]> {
    return this.components;
  }

  setComponents(components: ComponentView[]): void {
    this.components = components;
  }
}

// Mock implementation of IDependencyContextReader
class MockDependencyContextReader implements IDependencyContextReader {
  private dependencies: any[] = [];

  async findAll(): Promise<any[]> {
    return this.dependencies;
  }

  setDependencies(dependencies: any[]): void {
    this.dependencies = dependencies;
  }
}

describe("GetGoalContextQueryHandler", () => {
  let mockReader: MockGoalContextReader;
  let query: GetGoalContextQueryHandler;

  beforeEach(() => {
    mockReader = new MockGoalContextReader();
    query = new GetGoalContextQueryHandler(mockReader);
  });

  describe("execute", () => {
    it("should return goal context with goal details", async () => {
      // Arrange
      const goal: GoalView = {
        goalId: "goal_123",
        objective: "Implement JWT authentication",
        successCriteria: ["Token generation", "Middleware validates tokens"],
        scopeIn: ["UserController", "AuthMiddleware"],
        scopeOut: ["AdminRoutes"],
        boundaries: ["Keep API contract", "No DB schema changes"],
        status: "doing",
        version: 1,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
        progress: [],
      };

      mockReader.addGoal(goal);

      // Act
      const context = await query.execute("goal_123");

      // Assert
      expect(context.goal).toEqual(goal);
      expect(context.goal.objective).toBe("Implement JWT authentication");
      expect(context.goal.successCriteria).toHaveLength(2);
      expect(context.goal.scopeIn).toEqual(["UserController", "AuthMiddleware"]);
      expect(context.goal.boundaries).toHaveLength(2);
    });

    it("should return empty arrays for Phase 1 implementation", async () => {
      // Arrange
      const goal: GoalView = {
        goalId: "goal_456",
        objective: "Test goal",
        successCriteria: ["Criteria 1"],
        scopeIn: ["Component1"],
        scopeOut: [],
        boundaries: [],
        status: "to-do",
        version: 1,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
        progress: [],
      };

      mockReader.addGoal(goal);

      // Act
      const context = await query.execute("goal_456");

      // Assert - Phase 1 returns empty arrays for other categories
      expect(context.components).toEqual([]);
      expect(context.dependencies).toEqual([]);
      expect(context.decisions).toEqual([]);
      expect(context.invariants).toEqual([]);
      expect(context.guidelines).toEqual([]);
      expect(context.relations).toEqual([]);
    });

    it("should throw error when goal not found", async () => {
      // Act & Assert
      await expect(query.execute("nonexistent_goal")).rejects.toThrow(
        "Goal not found: nonexistent_goal"
      );
    });

    it("should handle goal with note field", async () => {
      // Arrange
      const goal: GoalView = {
        goalId: "goal_789",
        objective: "Blocked goal",
        successCriteria: ["Do something"],
        scopeIn: [],
        scopeOut: [],
        boundaries: [],
        status: "blocked",
        version: 1,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
        note: "Waiting for external API documentation",
        progress: [],
      };

      mockReader.addGoal(goal);

      // Act
      const context = await query.execute("goal_789");

      // Assert
      expect(context.goal.note).toBe("Waiting for external API documentation");
      expect(context.goal.status).toBe("blocked");
    });
  });

  describe("embedded context - invariants", () => {
    it("should use embedded invariants when present", async () => {
      // Arrange - goal created with --interactive has embedded invariants
      const goal: GoalView = {
        goalId: "goal_embedded_inv",
        objective: "Test embedded invariants",
        successCriteria: ["Test"],
        scopeIn: [],
        scopeOut: [],
        boundaries: [],
        status: "doing",
        version: 1,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
        relevantInvariants: [
          { title: "Single Responsibility", description: "One class, one reason to change" },
          { title: "No Junk Drawers", description: "No utils/ or helpers/ folders" },
        ],
        progress: [],
      };

      mockReader.addGoal(goal);

      // Act
      const context = await query.execute("goal_embedded_inv");

      // Assert - embedded invariants are mapped to InvariantContextView format
      expect(context.invariants).toHaveLength(2);
      expect(context.invariants[0].category).toBe("Single Responsibility");
      expect(context.invariants[0].description).toBe("One class, one reason to change");
      expect(context.invariants[1].category).toBe("No Junk Drawers");
    });

    it("should map embedded invariants with synthetic IDs", async () => {
      const goal: GoalView = {
        goalId: "goal_inv_ids",
        objective: "Test ID generation",
        successCriteria: ["Test"],
        scopeIn: [],
        scopeOut: [],
        boundaries: [],
        status: "doing",
        version: 1,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
        relevantInvariants: [
          { title: "Rule 1", description: "Description 1" },
        ],
        progress: [],
      };

      mockReader.addGoal(goal);
      const context = await query.execute("goal_inv_ids");

      expect(context.invariants[0].invariantId).toBe("embedded_inv_0");
    });
  });

  describe("embedded context - guidelines", () => {
    it("should use embedded guidelines when present", async () => {
      const goal: GoalView = {
        goalId: "goal_embedded_guide",
        objective: "Test embedded guidelines",
        successCriteria: ["Test"],
        scopeIn: [],
        scopeOut: [],
        boundaries: [],
        status: "doing",
        version: 1,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
        relevantGuidelines: [
          { title: "Coding Style", description: "Use descriptive variable names" },
          { title: "Testing", description: "All business rules must be unit tested" },
        ],
        progress: [],
      };

      mockReader.addGoal(goal);
      const context = await query.execute("goal_embedded_guide");

      expect(context.guidelines).toHaveLength(2);
      expect(context.guidelines[0].category).toBe("Coding Style");
      expect(context.guidelines[0].description).toBe("Use descriptive variable names");
      expect(context.guidelines[1].category).toBe("Testing");
    });

    it("should map embedded guidelines with synthetic IDs", async () => {
      const goal: GoalView = {
        goalId: "goal_guide_ids",
        objective: "Test ID generation",
        successCriteria: ["Test"],
        scopeIn: [],
        scopeOut: [],
        boundaries: [],
        status: "doing",
        version: 1,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
        relevantGuidelines: [
          { title: "Guide 1", description: "Description 1" },
        ],
        progress: [],
      };

      mockReader.addGoal(goal);
      const context = await query.execute("goal_guide_ids");

      expect(context.guidelines[0].guidelineId).toBe("embedded_guide_0");
    });
  });

  describe("embedded context - components", () => {
    it("should use embedded components when present", async () => {
      const goal: GoalView = {
        goalId: "goal_embedded_comp",
        objective: "Test embedded components",
        successCriteria: ["Test"],
        scopeIn: [],
        scopeOut: [],
        boundaries: [],
        status: "doing",
        version: 1,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
        relevantComponents: [
          { name: "GoalAggregate", responsibility: "Manages goal lifecycle" },
          { name: "EventStore", responsibility: "Persists domain events" },
        ],
        progress: [],
      };

      mockReader.addGoal(goal);
      const context = await query.execute("goal_embedded_comp");

      expect(context.components).toHaveLength(2);
      expect(context.components[0].name).toBe("GoalAggregate");
      expect(context.components[0].description).toBe("Manages goal lifecycle");
      expect(context.components[0].status).toBe("active");
      expect(context.components[1].name).toBe("EventStore");
    });

    it("should map embedded components with synthetic IDs", async () => {
      const goal: GoalView = {
        goalId: "goal_comp_ids",
        objective: "Test ID generation",
        successCriteria: ["Test"],
        scopeIn: [],
        scopeOut: [],
        boundaries: [],
        status: "doing",
        version: 1,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
        relevantComponents: [
          { name: "Component1", responsibility: "Does something" },
        ],
        progress: [],
      };

      mockReader.addGoal(goal);
      const context = await query.execute("goal_comp_ids");

      expect(context.components[0].componentId).toBe("embedded_comp_0");
    });
  });

  describe("embedded context - dependencies", () => {
    it("should use embedded dependencies when present", async () => {
      const goal: GoalView = {
        goalId: "goal_embedded_dep",
        objective: "Test embedded dependencies",
        successCriteria: ["Test"],
        scopeIn: [],
        scopeOut: [],
        boundaries: [],
        status: "doing",
        version: 1,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
        relevantDependencies: [
          { consumer: "GoalAggregate", provider: "EventStore" },
          { consumer: "QueryHandler", provider: "ProjectionStore" },
        ],
        progress: [],
      };

      mockReader.addGoal(goal);
      const context = await query.execute("goal_embedded_dep");

      expect(context.dependencies).toHaveLength(2);
      expect(context.dependencies[0].name).toBe("GoalAggregate → EventStore");
      expect(context.dependencies[0].purpose).toBe("Architectural dependency");
      expect(context.dependencies[1].name).toBe("QueryHandler → ProjectionStore");
    });

    it("should map embedded dependencies with synthetic IDs", async () => {
      const goal: GoalView = {
        goalId: "goal_dep_ids",
        objective: "Test ID generation",
        successCriteria: ["Test"],
        scopeIn: [],
        scopeOut: [],
        boundaries: [],
        status: "doing",
        version: 1,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
        relevantDependencies: [
          { consumer: "A", provider: "B" },
        ],
        progress: [],
      };

      mockReader.addGoal(goal);
      const context = await query.execute("goal_dep_ids");

      expect(context.dependencies[0].dependencyId).toBe("embedded_dep_0");
    });
  });

  describe("fallback behavior - legacy goals", () => {
    let mockInvariantReader: MockInvariantContextReader;
    let mockGuidelineReader: MockGuidelineContextReader;
    let queryWithReaders: GetGoalContextQueryHandler;

    beforeEach(() => {
      mockInvariantReader = new MockInvariantContextReader();
      mockGuidelineReader = new MockGuidelineContextReader();
      queryWithReaders = new GetGoalContextQueryHandler(
        mockReader,
        undefined, // componentReader
        undefined, // dependencyReader
        undefined, // decisionReader
        mockInvariantReader,
        mockGuidelineReader
      );
    });

    it("should query invariants from reader when no embedded invariants", async () => {
      // Arrange - legacy goal without embedded context
      const goal: GoalView = {
        goalId: "goal_legacy_inv",
        objective: "Legacy goal",
        successCriteria: ["Test"],
        scopeIn: [],
        scopeOut: [],
        boundaries: [],
        status: "doing",
        version: 1,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
        // No relevantInvariants field
        progress: [],
      };

      mockReader.addGoal(goal);
      mockInvariantReader.setInvariants([
        {
          invariantId: "inv_123",
          title: "DB Invariant",
          description: "From database",
          rationale: null,
          enforcement: "automatic",
          version: 1,
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
      ]);

      // Act
      const context = await queryWithReaders.execute("goal_legacy_inv");

      // Assert - should use queried invariants
      expect(context.invariants).toHaveLength(1);
      expect(context.invariants[0].invariantId).toBe("inv_123");
      expect(context.invariants[0].category).toBe("DB Invariant");
    });

    it("should query guidelines from reader when no embedded guidelines", async () => {
      const goal: GoalView = {
        goalId: "goal_legacy_guide",
        objective: "Legacy goal",
        successCriteria: ["Test"],
        scopeIn: [],
        scopeOut: [],
        boundaries: [],
        status: "doing",
        version: 1,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
        // No relevantGuidelines field
        progress: [],
      };

      mockReader.addGoal(goal);
      mockGuidelineReader.setGuidelines([
        {
          guidelineId: "guide_123",
          category: "codingStyle",
          title: "DB Guideline",
          description: "From database",
          rationale: "Reason",
          enforcement: "manual",
          examples: [],
          isRemoved: false,
          removedAt: null,
          removalReason: null,
          version: 1,
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
      ]);

      const context = await queryWithReaders.execute("goal_legacy_guide");

      expect(context.guidelines).toHaveLength(1);
      expect(context.guidelines[0].guidelineId).toBe("guide_123");
      expect(context.guidelines[0].category).toBe("codingStyle");
    });

    it("should prefer embedded over queried when embedded exists", async () => {
      const goal: GoalView = {
        goalId: "goal_prefer_embedded",
        objective: "Goal with both",
        successCriteria: ["Test"],
        scopeIn: [],
        scopeOut: [],
        boundaries: [],
        status: "doing",
        version: 1,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
        relevantInvariants: [
          { title: "Embedded Rule", description: "From goal creation" },
        ],
        progress: [],
      };

      mockReader.addGoal(goal);
      mockInvariantReader.setInvariants([
        {
          invariantId: "inv_db",
          title: "DB Rule",
          description: "From database",
          rationale: null,
          enforcement: "automatic",
          version: 1,
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
      ]);

      const context = await queryWithReaders.execute("goal_prefer_embedded");

      // Should use embedded, not queried
      expect(context.invariants).toHaveLength(1);
      expect(context.invariants[0].category).toBe("Embedded Rule");
      expect(context.invariants[0].invariantId).toBe("embedded_inv_0");
    });

    it("should filter out removed guidelines when querying", async () => {
      const goal: GoalView = {
        goalId: "goal_filter_removed",
        objective: "Test removed filtering",
        successCriteria: ["Test"],
        scopeIn: [],
        scopeOut: [],
        boundaries: [],
        status: "doing",
        version: 1,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
        progress: [],
      };

      mockReader.addGoal(goal);
      mockGuidelineReader.setGuidelines([
        {
          guidelineId: "guide_active",
          category: "codingStyle",
          title: "Active",
          description: "Active guideline",
          rationale: "",
          enforcement: "manual",
          examples: [],
          isRemoved: false,
          removedAt: null,
          removalReason: null,
          version: 1,
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
        {
          guidelineId: "guide_removed",
          category: "testing",
          title: "Removed",
          description: "Removed guideline",
          rationale: "",
          enforcement: "manual",
          examples: [],
          isRemoved: true,
          removedAt: "2025-01-02T00:00:00Z",
          removalReason: "Outdated",
          version: 2,
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-02T00:00:00Z",
        },
      ]);

      const context = await queryWithReaders.execute("goal_filter_removed");

      expect(context.guidelines).toHaveLength(1);
      expect(context.guidelines[0].guidelineId).toBe("guide_active");
    });

    it("should treat empty embedded array as no embedded context", async () => {
      const goal: GoalView = {
        goalId: "goal_empty_embedded",
        objective: "Empty embedded arrays",
        successCriteria: ["Test"],
        scopeIn: [],
        scopeOut: [],
        boundaries: [],
        status: "doing",
        version: 1,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
        relevantInvariants: [], // Empty array should trigger fallback
        progress: [],
      };

      mockReader.addGoal(goal);
      mockInvariantReader.setInvariants([
        {
          invariantId: "inv_fallback",
          title: "Fallback Rule",
          description: "Should be used",
          rationale: null,
          enforcement: "automatic",
          version: 1,
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
      ]);

      const context = await queryWithReaders.execute("goal_empty_embedded");

      // Empty array should trigger fallback to queried invariants
      expect(context.invariants).toHaveLength(1);
      expect(context.invariants[0].category).toBe("Fallback Rule");
    });
  });

  describe("component filtering by scope", () => {
    let mockComponentReader: MockComponentContextReader;
    let queryWithComponents: GetGoalContextQueryHandler;

    beforeEach(() => {
      mockComponentReader = new MockComponentContextReader();
      queryWithComponents = new GetGoalContextQueryHandler(
        mockReader,
        mockComponentReader
      );
    });

    it("should filter components by scopeIn", async () => {
      const goal: GoalView = {
        goalId: "goal_scope_filter",
        objective: "Test scope filtering",
        successCriteria: ["Test"],
        scopeIn: ["goal"],
        scopeOut: [],
        boundaries: [],
        status: "doing",
        version: 1,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
        progress: [],
      };

      mockReader.addGoal(goal);
      mockComponentReader.setComponents([
        {
          componentId: "comp_goal",
          name: "GoalAggregate",
          type: "service",
          description: "Goal management",
          responsibility: "Manages goals",
          path: "src/domain/goals",
          status: "active",
          deprecationReason: null,
          version: 1,
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
        {
          componentId: "comp_session",
          name: "SessionAggregate",
          type: "service",
          description: "Session management",
          responsibility: "Manages sessions",
          path: "src/domain/sessions",
          status: "active",
          deprecationReason: null,
          version: 1,
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
      ]);

      const context = await queryWithComponents.execute("goal_scope_filter");

      expect(context.components).toHaveLength(1);
      expect(context.components[0].name).toBe("GoalAggregate");
    });

    it("should exclude components in scopeOut", async () => {
      const goal: GoalView = {
        goalId: "goal_scope_out",
        objective: "Test scope exclusion",
        successCriteria: ["Test"],
        scopeIn: [],
        scopeOut: ["session"],
        boundaries: [],
        status: "doing",
        version: 1,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
        progress: [],
      };

      mockReader.addGoal(goal);
      mockComponentReader.setComponents([
        {
          componentId: "comp_goal",
          name: "GoalAggregate",
          type: "service",
          description: "Goal management",
          responsibility: "Manages goals",
          path: "src/domain/goals",
          status: "active",
          deprecationReason: null,
          version: 1,
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
        {
          componentId: "comp_session",
          name: "SessionAggregate",
          type: "service",
          description: "Session management",
          responsibility: "Manages sessions",
          path: "src/domain/sessions",
          status: "active",
          deprecationReason: null,
          version: 1,
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
      ]);

      const context = await queryWithComponents.execute("goal_scope_out");

      expect(context.components).toHaveLength(1);
      expect(context.components[0].name).toBe("GoalAggregate");
    });

    it("should only include active components", async () => {
      const goal: GoalView = {
        goalId: "goal_active_only",
        objective: "Test active filtering",
        successCriteria: ["Test"],
        scopeIn: [],
        scopeOut: [],
        boundaries: [],
        status: "doing",
        version: 1,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
        progress: [],
      };

      mockReader.addGoal(goal);
      mockComponentReader.setComponents([
        {
          componentId: "comp_active",
          name: "ActiveComponent",
          type: "service" as const,
          description: "Active",
          responsibility: "Active",
          path: "src/active",
          status: "active" as const,
          deprecationReason: null,
          version: 1,
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
        {
          componentId: "comp_deprecated",
          name: "DeprecatedComponent",
          type: "service" as const,
          description: "Deprecated",
          responsibility: "Deprecated",
          path: "src/deprecated",
          status: "deprecated" as const,
          deprecationReason: "Replaced",
          version: 2,
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-02T00:00:00Z",
        },
      ]);

      const context = await queryWithComponents.execute("goal_active_only");

      expect(context.components).toHaveLength(1);
      expect(context.components[0].name).toBe("ActiveComponent");
    });
  });
});
