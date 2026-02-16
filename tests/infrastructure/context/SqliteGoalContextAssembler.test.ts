import { describe, it, expect, beforeEach } from "@jest/globals";
import { SqliteGoalContextAssembler } from "../../../src/infrastructure/context/SqliteGoalContextAssembler.js";
import { IGoalReader } from "../../../src/application/context/goals/start/IGoalReader.js";
import { IRelationReader } from "../../../src/application/context/relations/IRelationReader.js";
import { IComponentViewReader, ComponentStatusFilter } from "../../../src/application/context/components/get/IComponentViewReader.js";
import { IDependencyViewReader, DependencyListFilter } from "../../../src/application/context/dependencies/get/IDependencyViewReader.js";
import { IDecisionViewReader, DecisionStatusFilter } from "../../../src/application/context/decisions/get/IDecisionViewReader.js";
import { IInvariantViewReader } from "../../../src/application/context/invariants/get/IInvariantViewReader.js";
import { IGuidelineViewReader } from "../../../src/application/context/guidelines/get/IGuidelineViewReader.js";
import { IArchitectureReader } from "../../../src/application/context/architecture/IArchitectureReader.js";
import { GoalView } from "../../../src/application/context/goals/GoalView.js";
import { ComponentView } from "../../../src/application/context/components/ComponentView.js";
import { DependencyView } from "../../../src/application/context/dependencies/DependencyView.js";
import { DecisionView } from "../../../src/application/context/decisions/DecisionView.js";
import { InvariantView } from "../../../src/application/context/invariants/InvariantView.js";
import { GuidelineView } from "../../../src/application/context/guidelines/GuidelineView.js";
import { ArchitectureView } from "../../../src/application/context/architecture/ArchitectureView.js";
import { RelationView } from "../../../src/application/context/relations/RelationView.js";
import { EntityType, EntityTypeValue } from "../../../src/domain/relations/Constants.js";
import { ComponentType } from "../../../src/domain/components/Constants.js";
import { GuidelineCategory } from "../../../src/domain/guidelines/Constants.js";

/**
 * Tests for SqliteGoalContextAssembler
 *
 * Tests cover:
 * - Default behavior: when no relations exist, fetch all entities
 * - Explicit relations: when relations exist, fetch only related entities
 * - Relation metadata mapping into RelatedContext<T>
 * - Architecture handling
 */

// Mock implementations
class MockGoalReader implements IGoalReader {
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

class MockComponentViewReader implements IComponentViewReader {
  private components: ComponentView[] = [];

  async findAll(_status?: ComponentStatusFilter): Promise<ComponentView[]> {
    return this.components;
  }

  async findByIds(ids: string[]): Promise<ComponentView[]> {
    return this.components.filter(c => ids.includes(c.componentId));
  }

  setComponents(components: ComponentView[]): void {
    this.components = components;
  }
}

class MockDependencyViewReader implements IDependencyViewReader {
  private dependencies: DependencyView[] = [];

  async findAll(_filter?: DependencyListFilter): Promise<DependencyView[]> {
    return this.dependencies;
  }

  async findByIds(ids: string[]): Promise<DependencyView[]> {
    return this.dependencies.filter(d => ids.includes(d.dependencyId));
  }

  setDependencies(dependencies: DependencyView[]): void {
    this.dependencies = dependencies;
  }
}

class MockDecisionViewReader implements IDecisionViewReader {
  private decisions: DecisionView[] = [];

  async findAll(status?: DecisionStatusFilter): Promise<DecisionView[]> {
    if (status && status !== 'all') {
      return this.decisions.filter(d => d.status === status);
    }
    return this.decisions;
  }

  async findByIds(ids: string[]): Promise<DecisionView[]> {
    return this.decisions.filter(d => ids.includes(d.decisionId));
  }

  setDecisions(decisions: DecisionView[]): void {
    this.decisions = decisions;
  }
}

class MockInvariantViewReader implements IInvariantViewReader {
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

class MockGuidelineViewReader implements IGuidelineViewReader {
  private guidelines: GuidelineView[] = [];

  async findAll(_category?: string): Promise<GuidelineView[]> {
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
  let goalReader: MockGoalReader;
  let relationReader: MockRelationReader;
  let componentReader: MockComponentViewReader;
  let dependencyReader: MockDependencyViewReader;
  let decisionReader: MockDecisionViewReader;
  let invariantReader: MockInvariantViewReader;
  let guidelineReader: MockGuidelineViewReader;
  let architectureReader: MockArchitectureReader;
  let assembler: SqliteGoalContextAssembler;

  beforeEach(() => {
    goalReader = new MockGoalReader();
    relationReader = new MockRelationReader();
    componentReader = new MockComponentViewReader();
    dependencyReader = new MockDependencyViewReader();
    decisionReader = new MockDecisionViewReader();
    invariantReader = new MockInvariantViewReader();
    guidelineReader = new MockGuidelineViewReader();
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
      expect(result!.context.components).toHaveLength(1);
      expect(result!.context.components[0]).toEqual({
        entity: component,
        relationType: "default",
        relationDescription: ""
      });
      expect(result!.context.dependencies).toHaveLength(1);
      expect(result!.context.dependencies[0]).toEqual({
        entity: dependency,
        relationType: "default",
        relationDescription: ""
      });
      expect(result!.context.decisions).toHaveLength(1);
      expect(result!.context.decisions[0]).toEqual({
        entity: decision,
        relationType: "default",
        relationDescription: ""
      });
      expect(result!.context.invariants).toHaveLength(1);
      expect(result!.context.invariants[0]).toEqual({
        entity: invariant,
        relationType: "default",
        relationDescription: ""
      });
      expect(result!.context.guidelines).toHaveLength(1);
      expect(result!.context.guidelines[0]).toEqual({
        entity: guideline,
        relationType: "default",
        relationDescription: ""
      });
      expect(result!.context.architecture).toEqual(architecture);
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
      expect(result!.context.components).toHaveLength(1);
      expect(result!.context.components[0]).toEqual({
        entity: component1,
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
      expect(result!.context.components).toHaveLength(1);
      expect(result!.context.components[0].relationType).toBe("modifies");
      expect(result!.context.components[0].relationDescription).toBe("Active relation");
    });
  });
});
