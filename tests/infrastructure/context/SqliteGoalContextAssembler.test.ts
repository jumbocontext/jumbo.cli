import { describe, it, expect, beforeEach } from "@jest/globals";
import { SqliteGoalContextAssembler } from "../../../src/infrastructure/context/SqliteGoalContextAssembler.js";
import { IGoalContextReader } from "../../../src/application/goals/get-context/IGoalContextReader.js";
import { IRelationReader } from "../../../src/application/relations/IRelationReader.js";
import { IComponentContextReader } from "../../../src/application/goals/get-context/IComponentContextReader.js";
import { IDependencyContextReader } from "../../../src/application/goals/get-context/IDependencyContextReader.js";
import { IDecisionContextReader } from "../../../src/application/goals/get-context/IDecisionContextReader.js";
import { IInvariantContextReader } from "../../../src/application/goals/get-context/IInvariantContextReader.js";
import { IGuidelineContextReader } from "../../../src/application/goals/get-context/IGuidelineContextReader.js";
import { IArchitectureReader } from "../../../src/application/architecture/IArchitectureReader.js";
import { GoalView } from "../../../src/application/goals/GoalView.js";
import { ComponentView } from "../../../src/application/components/ComponentView.js";
import { DependencyView } from "../../../src/application/dependencies/DependencyView.js";
import { DecisionView } from "../../../src/application/decisions/DecisionView.js";
import { InvariantView } from "../../../src/application/invariants/InvariantView.js";
import { GuidelineView } from "../../../src/application/guidelines/GuidelineView.js";
import { ArchitectureView } from "../../../src/application/architecture/ArchitectureView.js";
import { RelationView } from "../../../src/application/relations/RelationView.js";
import { EntityType, EntityTypeValue } from "../../../src/domain/relations/Constants.js";
import { ComponentType } from "../../../src/domain/components/Constants.js";
import { GuidelineCategory } from "../../../src/domain/guidelines/Constants.js";

/**
 * Tests for SqliteGoalContextAssembler
 *
 * Tests cover:
 * - Default behavior: when no relations exist, fetch all entities
 * - Explicit relations: when relations exist, fetch only related entities
 * - Relation metadata mapping
 * - Architecture handling
 */

// Mock implementations
class MockGoalContextReader implements IGoalContextReader {
  private goals: Map<string, GoalView> = new Map();

  async findById(goalId: string): Promise<GoalView | null> {
    return this.goals.get(goalId) || null;
  }

  setGoal(goal: GoalView): void {
    this.goals.set(goal.goalId, goal);
  }
}

class MockRelationReader implements IRelationReader {
  private relations: RelationView[] = [];

  async findByFromEntity(entityType: EntityTypeValue, entityId: string): Promise<RelationView[]> {
    return this.relations.filter(
      r => r.fromEntityType === entityType && r.fromEntityId === entityId
    );
  }

  async findByToEntity(entityType: EntityTypeValue, entityId: string): Promise<RelationView[]> {
    return this.relations.filter(
      r => r.toEntityType === entityType && r.toEntityId === entityId
    );
  }

  setRelations(relations: RelationView[]): void {
    this.relations = relations;
  }
}

class MockComponentContextReader implements IComponentContextReader {
  private components: ComponentView[] = [];

  async findAll(): Promise<ComponentView[]> {
    return this.components;
  }

  async findByIds(ids: string[]): Promise<ComponentView[]> {
    return this.components.filter(c => ids.includes(c.componentId));
  }

  setComponents(components: ComponentView[]): void {
    this.components = components;
  }
}

class MockDependencyContextReader implements IDependencyContextReader {
  private dependencies: DependencyView[] = [];

  async findAll(): Promise<DependencyView[]> {
    return this.dependencies;
  }

  async findByIds(ids: string[]): Promise<DependencyView[]> {
    return this.dependencies.filter(d => ids.includes(d.dependencyId));
  }

  setDependencies(dependencies: DependencyView[]): void {
    this.dependencies = dependencies;
  }
}

class MockDecisionContextReader implements IDecisionContextReader {
  private decisions: DecisionView[] = [];

  async findAllActive(): Promise<DecisionView[]> {
    return this.decisions.filter(d => d.status === 'active');
  }

  async findByIds(ids: string[]): Promise<DecisionView[]> {
    return this.decisions.filter(d => ids.includes(d.decisionId));
  }

  setDecisions(decisions: DecisionView[]): void {
    this.decisions = decisions;
  }
}

class MockInvariantContextReader implements IInvariantContextReader {
  private invariants: InvariantView[] = [];

  async findAll(): Promise<InvariantView[]> {
    return this.invariants;
  }

  async findByIds(ids: string[]): Promise<InvariantView[]> {
    return this.invariants.filter(i => ids.includes(i.invariantId));
  }

  setInvariants(invariants: InvariantView[]): void {
    this.invariants = invariants;
  }
}

class MockGuidelineContextReader implements IGuidelineContextReader {
  private guidelines: GuidelineView[] = [];

  async findAll(): Promise<GuidelineView[]> {
    return this.guidelines;
  }

  async findByIds(ids: string[]): Promise<GuidelineView[]> {
    return this.guidelines.filter(g => ids.includes(g.guidelineId));
  }

  setGuidelines(guidelines: GuidelineView[]): void {
    this.guidelines = guidelines;
  }
}

class MockArchitectureReader implements IArchitectureReader {
  private architecture: ArchitectureView | null = null;

  async find(): Promise<ArchitectureView | null> {
    return this.architecture;
  }

  setArchitecture(architecture: ArchitectureView | null): void {
    this.architecture = architecture;
  }
}

describe("SqliteGoalContextAssembler", () => {
  let goalReader: MockGoalContextReader;
  let relationReader: MockRelationReader;
  let componentReader: MockComponentContextReader;
  let dependencyReader: MockDependencyContextReader;
  let decisionReader: MockDecisionContextReader;
  let invariantReader: MockInvariantContextReader;
  let guidelineReader: MockGuidelineContextReader;
  let architectureReader: MockArchitectureReader;
  let assembler: SqliteGoalContextAssembler;

  beforeEach(() => {
    goalReader = new MockGoalContextReader();
    relationReader = new MockRelationReader();
    componentReader = new MockComponentContextReader();
    dependencyReader = new MockDependencyContextReader();
    decisionReader = new MockDecisionContextReader();
    invariantReader = new MockInvariantContextReader();
    guidelineReader = new MockGuidelineContextReader();
    architectureReader = new MockArchitectureReader();

    assembler = new SqliteGoalContextAssembler(
      goalReader,
      relationReader,
      componentReader,
      dependencyReader,
      decisionReader,
      invariantReader,
      guidelineReader,
      architectureReader
    );
  });

  describe("assembleContextForGoal", () => {
    it("should return null when goal does not exist", async () => {
      const result = await assembler.assembleContextForGoal("nonexistent_goal");
      expect(result).toBeNull();
    });

    it("should return all entities with default relation metadata when no relations exist", async () => {
      // Arrange
      const goal: GoalView = {
        goalId: "goal_123",
        objective: "Implement feature X",
        successCriteria: ["Criterion 1"],
        scopeIn: [],
        scopeOut: [],
        status: "doing",
        version: 1,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
        progress: []
      };

      const component: ComponentView = {
        componentId: "comp_1",
        name: "UserService",
        type: ComponentType.SERVICE,
        description: "Handle user operations",
        responsibility: "Manage user data",
        path: "src/services/UserService.ts",
        status: "active",
        deprecationReason: null,
        version: 1,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z"
      };

      const dependency: DependencyView = {
        dependencyId: "dep_1",
        consumerId: "comp_1",
        providerId: "comp_2",
        endpoint: "/api/users",
        contract: null,
        status: "active",
        version: 1,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
        removedAt: null,
        removalReason: null
      };

      const decision: DecisionView = {
        decisionId: "dec_1",
        title: "Use REST API",
        context: "Need API architecture",
        rationale: "RESTful architecture for API",
        alternatives: ["GraphQL", "gRPC"],
        consequences: "Standard HTTP methods",
        status: "active",
        supersededBy: null,
        reversalReason: null,
        reversedAt: null,
        version: 1,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z"
      };

      const invariant: InvariantView = {
        invariantId: "inv_1",
        title: "Single Responsibility",
        description: "Each class has one reason to change",
        rationale: "Improves maintainability",
        enforcement: "Code review",
        version: 1,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z"
      };

      const guideline: GuidelineView = {
        guidelineId: "guide_1",
        category: GuidelineCategory.TESTING,
        title: "Test all business rules",
        description: "All business logic must be unit tested",
        rationale: "Ensures correctness",
        enforcement: "CI/CD pipeline",
        examples: ["Unit tests for all services"],
        isRemoved: false,
        removedAt: null,
        removalReason: null,
        version: 1,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z"
      };

      const architecture: ArchitectureView = {
        architectureId: "arch_1",
        description: "Clean Architecture",
        organization: "Layered",
        patterns: ["CQRS", "Event Sourcing"],
        principles: ["Separation of concerns"],
        dataStores: [],
        stack: ["TypeScript", "Node.js"],
        version: 1,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z"
      };

      goalReader.setGoal(goal);
      componentReader.setComponents([component]);
      dependencyReader.setDependencies([dependency]);
      decisionReader.setDecisions([decision]);
      invariantReader.setInvariants([invariant]);
      guidelineReader.setGuidelines([guideline]);
      architectureReader.setArchitecture(architecture);
      relationReader.setRelations([]); // No relations

      // Act
      const result = await assembler.assembleContextForGoal("goal_123");

      // Assert
      expect(result).not.toBeNull();
      expect(result!.goal).toEqual(goal);
      expect(result!.components).toHaveLength(1);
      expect(result!.components[0]).toEqual({
        ...component,
        relationType: "default",
        relationDescription: ""
      });
      expect(result!.dependencies).toHaveLength(1);
      expect(result!.dependencies[0]).toEqual({
        ...dependency,
        relationType: "default",
        relationDescription: ""
      });
      expect(result!.decisions).toHaveLength(1);
      expect(result!.decisions[0]).toEqual({
        ...decision,
        relationType: "default",
        relationDescription: ""
      });
      expect(result!.invariants).toHaveLength(1);
      expect(result!.invariants[0]).toEqual({
        ...invariant,
        relationType: "default",
        relationDescription: ""
      });
      expect(result!.guidelines).toHaveLength(1);
      expect(result!.guidelines[0]).toEqual({
        ...guideline,
        relationType: "default",
        relationDescription: ""
      });
      expect(result!.architecture).toEqual(architecture);
    });

    it("should return only related entities when explicit relations exist", async () => {
      // Arrange
      const goal: GoalView = {
        goalId: "goal_123",
        objective: "Implement feature X",
        successCriteria: ["Criterion 1"],
        scopeIn: [],
        scopeOut: [],
        status: "doing",
        version: 1,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
        progress: []
      };

      const component1: ComponentView = {
        componentId: "comp_1",
        name: "UserService",
        type: ComponentType.SERVICE,
        description: "Handle user operations",
        responsibility: "Manage user data",
        path: "src/services/UserService.ts",
        status: "active",
        deprecationReason: null,
        version: 1,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z"
      };

      const component2: ComponentView = {
        componentId: "comp_2",
        name: "AdminService",
        type: ComponentType.SERVICE,
        description: "Handle admin operations",
        responsibility: "Manage admin data",
        path: "src/services/AdminService.ts",
        status: "active",
        deprecationReason: null,
        version: 1,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z"
      };

      const relation: RelationView = {
        relationId: "rel_1",
        fromEntityType: EntityType.GOAL,
        fromEntityId: "goal_123",
        toEntityType: EntityType.COMPONENT,
        toEntityId: "comp_1",
        relationType: "modifies",
        strength: null,
        description: "This goal modifies UserService",
        status: "active",
        version: 1,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z"
      };

      goalReader.setGoal(goal);
      componentReader.setComponents([component1, component2]);
      relationReader.setRelations([relation]);

      // Act
      const result = await assembler.assembleContextForGoal("goal_123");

      // Assert
      expect(result).not.toBeNull();
      expect(result!.components).toHaveLength(1);
      expect(result!.components[0]).toEqual({
        ...component1,
        relationType: "modifies",
        relationDescription: "This goal modifies UserService"
      });
    });

    it("should filter out inactive relations", async () => {
      // Arrange
      const goal: GoalView = {
        goalId: "goal_123",
        objective: "Implement feature X",
        successCriteria: ["Criterion 1"],
        scopeIn: [],
        scopeOut: [],
        status: "doing",
        version: 1,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
        progress: []
      };

      const component: ComponentView = {
        componentId: "comp_1",
        name: "UserService",
        type: ComponentType.SERVICE,
        description: "Handle user operations",
        responsibility: "Manage user data",
        path: "src/services/UserService.ts",
        status: "active",
        deprecationReason: null,
        version: 1,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z"
      };

      const activeRelation: RelationView = {
        relationId: "rel_1",
        fromEntityType: EntityType.GOAL,
        fromEntityId: "goal_123",
        toEntityType: EntityType.COMPONENT,
        toEntityId: "comp_1",
        relationType: "modifies",
        strength: null,
        description: "Active relation",
        status: "active",
        version: 1,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z"
      };

      const inactiveRelation: RelationView = {
        relationId: "rel_2",
        fromEntityType: EntityType.GOAL,
        fromEntityId: "goal_123",
        toEntityType: EntityType.COMPONENT,
        toEntityId: "comp_1",
        relationType: "uses",
        strength: null,
        description: "Inactive relation",
        status: "removed",
        version: 1,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z"
      };

      goalReader.setGoal(goal);
      componentReader.setComponents([component]);
      relationReader.setRelations([activeRelation, inactiveRelation]);

      // Act
      const result = await assembler.assembleContextForGoal("goal_123");

      // Assert
      expect(result).not.toBeNull();
      expect(result!.components).toHaveLength(1);
      expect(result!.components[0].relationType).toBe("modifies");
      expect(result!.components[0].relationDescription).toBe("Active relation");
    });
  });
});
