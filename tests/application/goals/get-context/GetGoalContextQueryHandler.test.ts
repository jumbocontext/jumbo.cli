import { describe, it, expect, beforeEach } from "@jest/globals";
import { GetGoalContextQueryHandler } from "../../../../src/application/goals/get-context/GetGoalContextQueryHandler.js";
import { IGoalContextReader } from "../../../../src/application/goals/get-context/IGoalContextReader.js";
import { IInvariantContextReader } from "../../../../src/application/goals/get-context/IInvariantContextReader.js";
import { IGuidelineContextReader } from "../../../../src/application/goals/get-context/IGuidelineContextReader.js";
import { IComponentContextReader } from "../../../../src/application/goals/get-context/IComponentContextReader.js";
import { IDependencyContextReader } from "../../../../src/application/goals/get-context/IDependencyContextReader.js";
import { IDecisionContextReader } from "../../../../src/application/goals/get-context/IDecisionContextReader.js";
import { IArchitectureReader } from "../../../../src/application/architecture/IArchitectureReader.js";
import { IRelationReader } from "../../../../src/application/relations/IRelationReader.js";
import { GoalView } from "../../../../src/application/goals/GoalView.js";
import { InvariantView } from "../../../../src/application/invariants/InvariantView.js";
import { GuidelineView } from "../../../../src/application/guidelines/GuidelineView.js";
import { ComponentView } from "../../../../src/application/components/ComponentView.js";
import { DecisionView } from "../../../../src/application/decisions/DecisionView.js";
import { ArchitectureView } from "../../../../src/application/architecture/ArchitectureView.js";
import { RelationView } from "../../../../src/application/relations/RelationView.js";
import { EntityTypeValue } from "../../../../src/domain/relations/Constants.js";

/**
 * Tests for GetGoalContextQueryHandler
 *
 * Tests cover:
 * - Basic goal retrieval
 * - Context reader behavior (always uses dedicated readers)
 * - Component filtering by scope
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

// Mock implementation of IDecisionContextReader
class MockDecisionContextReader implements IDecisionContextReader {
  private decisions: DecisionView[] = [];

  async findAllActive(): Promise<DecisionView[]> {
    return this.decisions;
  }

  setDecisions(decisions: DecisionView[]): void {
    this.decisions = decisions;
  }
}

// Mock implementation of IArchitectureReader
class MockArchitectureReader implements IArchitectureReader {
  private architecture: ArchitectureView | null = null;

  async find(): Promise<ArchitectureView | null> {
    return this.architecture;
  }

  setArchitecture(architecture: ArchitectureView | null): void {
    this.architecture = architecture;
  }
}

// Mock implementation of IRelationReader
class MockRelationReader implements IRelationReader {
  private fromRelations: Map<string, RelationView[]> = new Map();
  private toRelations: Map<string, RelationView[]> = new Map();

  async findByFromEntity(_entityType: EntityTypeValue, entityId: string): Promise<RelationView[]> {
    return this.fromRelations.get(entityId) || [];
  }

  async findByToEntity(_entityType: EntityTypeValue, entityId: string): Promise<RelationView[]> {
    return this.toRelations.get(entityId) || [];
  }

  setFromRelations(entityId: string, relations: RelationView[]): void {
    this.fromRelations.set(entityId, relations);
  }

  setToRelations(entityId: string, relations: RelationView[]): void {
    this.toRelations.set(entityId, relations);
  }
}

describe("GetGoalContextQueryHandler", () => {
  let mockReader: MockGoalContextReader;
  let mockComponentReader: MockComponentContextReader;
  let mockDependencyReader: MockDependencyContextReader;
  let mockDecisionReader: MockDecisionContextReader;
  let mockInvariantReader: MockInvariantContextReader;
  let mockGuidelineReader: MockGuidelineContextReader;
  let mockArchitectureReader: MockArchitectureReader;
  let mockRelationReader: MockRelationReader;
  let query: GetGoalContextQueryHandler;

  beforeEach(() => {
    mockReader = new MockGoalContextReader();
    mockComponentReader = new MockComponentContextReader();
    mockDependencyReader = new MockDependencyContextReader();
    mockDecisionReader = new MockDecisionContextReader();
    mockInvariantReader = new MockInvariantContextReader();
    mockGuidelineReader = new MockGuidelineContextReader();
    mockArchitectureReader = new MockArchitectureReader();
    mockRelationReader = new MockRelationReader();
    query = new GetGoalContextQueryHandler(
      mockReader,
      mockComponentReader,
      mockDependencyReader,
      mockDecisionReader,
      mockInvariantReader,
      mockGuidelineReader,
      mockArchitectureReader,
      mockRelationReader
    );
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

    it("should return empty arrays when readers have no data", async () => {
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

      // Assert
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

  describe("context reader behavior", () => {
    it("should query invariants from reader", async () => {
      const goal: GoalView = {
        goalId: "goal_inv",
        objective: "Test invariants",
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

      const context = await query.execute("goal_inv");

      expect(context.invariants).toHaveLength(1);
      expect(context.invariants[0].invariantId).toBe("inv_123");
      expect(context.invariants[0].category).toBe("DB Invariant");
    });

    it("should query guidelines from reader", async () => {
      const goal: GoalView = {
        goalId: "goal_guide",
        objective: "Test guidelines",
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

      const context = await query.execute("goal_guide");

      expect(context.guidelines).toHaveLength(1);
      expect(context.guidelines[0].guidelineId).toBe("guide_123");
      expect(context.guidelines[0].category).toBe("codingStyle");
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

      const context = await query.execute("goal_filter_removed");

      expect(context.guidelines).toHaveLength(1);
      expect(context.guidelines[0].guidelineId).toBe("guide_active");
    });

    it("should use readers even when goal has embedded context fields", async () => {
      // Arrange - goal has embedded fields, but handler should ignore them
      const goal: GoalView = {
        goalId: "goal_embedded_ignored",
        objective: "Goal with embedded context",
        successCriteria: ["Test"],
        scopeIn: [],
        scopeOut: [],
        boundaries: [],
        status: "doing",
        version: 1,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
        relevantInvariants: [
          { title: "Embedded Rule", description: "Should be ignored" },
        ],
        relevantGuidelines: [
          { title: "Embedded Guideline", description: "Should be ignored" },
        ],
        relevantComponents: [
          { name: "EmbeddedComponent", responsibility: "Should be ignored" },
        ],
        relevantDependencies: [
          { consumer: "A", provider: "B" },
        ],
        architecture: {
          description: "Embedded arch",
          organization: "Embedded org",
          patterns: ["embedded-pattern"],
          principles: ["embedded-principle"],
        },
        progress: [],
      };

      mockReader.addGoal(goal);

      // Set up reader data
      mockInvariantReader.setInvariants([
        {
          invariantId: "inv_from_reader",
          title: "Reader Invariant",
          description: "From reader",
          rationale: null,
          enforcement: "automatic",
          version: 1,
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
      ]);
      mockGuidelineReader.setGuidelines([
        {
          guidelineId: "guide_from_reader",
          category: "codingStyle",
          title: "Reader Guideline",
          description: "From reader",
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
      ]);

      // Act
      const context = await query.execute("goal_embedded_ignored");

      // Assert - should use reader data, not embedded fields
      expect(context.invariants).toHaveLength(1);
      expect(context.invariants[0].invariantId).toBe("inv_from_reader");
      expect(context.invariants[0].category).toBe("Reader Invariant");

      expect(context.guidelines).toHaveLength(1);
      expect(context.guidelines[0].guidelineId).toBe("guide_from_reader");
      expect(context.guidelines[0].category).toBe("codingStyle");

      // Components come from reader (empty), not embedded
      expect(context.components).toEqual([]);
    });
  });

  describe("component filtering by scope", () => {
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

      const context = await query.execute("goal_scope_filter");

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

      const context = await query.execute("goal_scope_out");

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

      const context = await query.execute("goal_active_only");

      expect(context.components).toHaveLength(1);
      expect(context.components[0].name).toBe("ActiveComponent");
    });
  });
});
