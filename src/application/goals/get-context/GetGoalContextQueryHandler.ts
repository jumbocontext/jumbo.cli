import { IGoalContextReader } from "./IGoalContextReader.js";
import {
  GoalContextView,
  InvariantContextView,
  GuidelineContextView,
  ComponentContextView,
  DependencyContextView,
} from "./GoalContextView.js";
import { IComponentContextReader } from "./IComponentContextReader.js";
import { IDependencyContextReader } from "./IDependencyContextReader.js";
import { IDecisionContextReader } from "./IDecisionContextReader.js";
import { IInvariantContextReader } from "./IInvariantContextReader.js";
import { IGuidelineContextReader } from "./IGuidelineContextReader.js";
import { IArchitectureReader } from "../../../application/architecture/IArchitectureReader.js";
import { IRelationReader } from "../../relations/IRelationReader.js";
import { InvariantView } from "../../invariants/InvariantView.js";
import { GoalView } from "../GoalView.js";

/**
 * GetGoalContextQueryHandler - Query handler for goal context retrieval
 *
 * Retrieves comprehensive context for a goal, filtered by scope for token optimization.
 *
 * Returns context across 5 categories:
 * 1. Work - Goal details (objective, criteria, scope, boundaries)
 * 2. Solution - Components, dependencies, decisions (filtered by scopeIn/scopeOut)
 * 3. Invariants - Non-negotiable constraints
 * 4. Guidelines - Execution guidelines
 * 5. Relations - Connections between entities
 */
export class GetGoalContextQueryHandler {
  constructor(
    private readonly goalReader: IGoalContextReader,
    private readonly componentReader?: IComponentContextReader,
    private readonly dependencyReader?: IDependencyContextReader,
    private readonly decisionReader?: IDecisionContextReader,
    private readonly invariantReader?: IInvariantContextReader,
    private readonly guidelineReader?: IGuidelineContextReader,
    private readonly architectureReader?: IArchitectureReader,
    private readonly relationReader?: IRelationReader
  ) {}

  /**
   * Execute the query to get goal context
   *
   * Prefers embedded context when available (from --interactive goal creation).
   * Falls back to querying all context when embedded fields are empty/null.
   *
   * @param goalId - ID of the goal to get context for
   * @returns GoalContextView with all context data
   * @throws Error if goal not found
   */
  async execute(goalId: string): Promise<GoalContextView> {
    // Phase 1: Get goal details
    const goal = await this.goalReader.findById(goalId);

    if (!goal) {
      throw new Error(`Goal not found: ${goalId}`);
    }

    // Phase 2: Get components - prefer embedded, else filter by scope
    const components = this.hasEmbeddedComponents(goal)
      ? this.mapEmbeddedComponents(goal.relevantComponents!)
      : await this.filterComponents(goal.scopeIn, goal.scopeOut);

    // Phase 2: Get dependencies - prefer embedded, else filter by scoped components
    const dependencies = this.hasEmbeddedDependencies(goal)
      ? this.mapEmbeddedDependencies(goal.relevantDependencies!)
      : await this.filterDependencies(components);

    // Phase 2: Get active decisions (no embedded field for decisions)
    const decisions = await this.getDecisions();

    // Phase 3: Get invariants - prefer embedded, else query all
    const invariants = this.hasEmbeddedInvariants(goal)
      ? this.mapEmbeddedInvariants(goal.relevantInvariants!)
      : await this.getInvariants();

    // Phase 3: Get guidelines - prefer embedded, else query all
    const guidelines = this.hasEmbeddedGuidelines(goal)
      ? this.mapEmbeddedGuidelines(goal.relevantGuidelines!)
      : await this.getGuidelines();

    // Phase 3: Get architecture - prefer embedded, else query global
    const architecture = this.hasEmbeddedArchitecture(goal)
      ? goal.architecture
      : await this.getArchitecture();

    // Phase 4: Get relations (only when using queried components)
    const relations = this.hasEmbeddedComponents(goal)
      ? []
      : await this.getRelations(components);

    return {
      goal,
      components,
      dependencies,
      decisions,
      invariants,
      guidelines,
      architecture,
      relations,
    };
  }

  /**
   * Check if goal has embedded invariants
   */
  private hasEmbeddedInvariants(goal: GoalView): boolean {
    return Array.isArray(goal.relevantInvariants) && goal.relevantInvariants.length > 0;
  }

  /**
   * Check if goal has embedded guidelines
   */
  private hasEmbeddedGuidelines(goal: GoalView): boolean {
    return Array.isArray(goal.relevantGuidelines) && goal.relevantGuidelines.length > 0;
  }

  /**
   * Check if goal has embedded architecture
   */
  private hasEmbeddedArchitecture(goal: GoalView): boolean {
    return goal.architecture !== undefined && goal.architecture !== null;
  }

  /**
   * Check if goal has embedded components
   */
  private hasEmbeddedComponents(goal: GoalView): boolean {
    return Array.isArray(goal.relevantComponents) && goal.relevantComponents.length > 0;
  }

  /**
   * Check if goal has embedded dependencies
   */
  private hasEmbeddedDependencies(goal: GoalView): boolean {
    return Array.isArray(goal.relevantDependencies) && goal.relevantDependencies.length > 0;
  }

  /**
   * Map embedded invariants to InvariantContextView format
   */
  private mapEmbeddedInvariants(invariants: NonNullable<GoalView["relevantInvariants"]>): InvariantContextView[] {
    return invariants.map((inv, index) => ({
      invariantId: `embedded_inv_${index}`,
      category: inv.title,
      description: inv.description,
    }));
  }

  /**
   * Map embedded guidelines to GuidelineContextView format
   */
  private mapEmbeddedGuidelines(guidelines: NonNullable<GoalView["relevantGuidelines"]>): GuidelineContextView[] {
    return guidelines.map((g, index) => ({
      guidelineId: `embedded_guide_${index}`,
      category: g.title,
      description: g.description,
    }));
  }

  /**
   * Map embedded components to ComponentContextView format
   */
  private mapEmbeddedComponents(components: NonNullable<GoalView["relevantComponents"]>): ComponentContextView[] {
    return components.map((c, index) => ({
      componentId: `embedded_comp_${index}`,
      name: c.name,
      description: c.responsibility,
      status: "active",
    }));
  }

  /**
   * Map embedded dependencies to DependencyContextView format
   */
  private mapEmbeddedDependencies(dependencies: NonNullable<GoalView["relevantDependencies"]>): DependencyContextView[] {
    return dependencies.map((d, index) => ({
      dependencyId: `embedded_dep_${index}`,
      name: `${d.consumer} → ${d.provider}`,
      purpose: "Architectural dependency",
    }));
  }

  /**
   * Filter components by scopeIn and scopeOut
   *
   * @param scopeIn - Component names to include
   * @param scopeOut - Component names to exclude
   * @returns Filtered component context views
   */
  private async filterComponents(scopeIn: string[], scopeOut: string[]): Promise<Array<{ componentId: string; name: string; description: string; status: string }>> {
    if (!this.componentReader) {
      return [];
    }

    const allComponents = await this.componentReader.findAll();

    // Filter by scopeIn (case-insensitive) and exclude scopeOut
    const filtered = allComponents.filter((component) => {
      const name = component.name.toLowerCase();

      // Check if in scopeOut (exclude)
      const isExcluded = scopeOut.some(out => name.includes(out.toLowerCase()) || out.toLowerCase().includes(name));
      if (isExcluded) {
        return false;
      }

      // If scopeIn is empty, include all (except those in scopeOut)
      if (scopeIn.length === 0) {
        return true;
      }

      // Check if in scopeIn (include)
      return scopeIn.some(in_ => name.includes(in_.toLowerCase()) || in_.toLowerCase().includes(name));
    });

    // Map to simplified context view
    return filtered
      .filter(c => c.status === 'active') // Only include active components
      .map((c) => ({
        componentId: c.componentId,
        name: c.name,
        description: c.description,
        status: c.status,
      }));
  }

  /**
   * Get dependencies for scoped components
   *
   * @param components - Filtered components
   * @returns Dependency context views
   */
  private async filterDependencies(components: any[]): Promise<any[]> {
    if (!this.dependencyReader || components.length === 0) {
      return [];
    }

    const componentIds = new Set(components.map(c => c.componentId));
    const allDependencies = await this.dependencyReader.findAll();

    // Filter dependencies where consumer or provider is in scoped components
    const filtered = allDependencies.filter((dep) =>
      componentIds.has(dep.consumerId) || componentIds.has(dep.providerId)
    );

    // Map to context view - use consumer and provider names for clarity
    return filtered
      .filter(d => d.status === 'active')
      .map((d) => {
        const consumer = components.find(c => c.componentId === d.consumerId);
        const provider = components.find(c => c.componentId === d.providerId);

        return {
          dependencyId: d.dependencyId,
          name: `${consumer?.name || d.consumerId} → ${provider?.name || d.providerId}`,
          version: null,
          purpose: d.contract || d.endpoint || "Architectural dependency",
        };
      });
  }

  /**
   * Get active decisions
   *
   * @returns Decision context views
   */
  private async getDecisions(): Promise<any[]> {
    if (!this.decisionReader) {
      return [];
    }

    const activeDecisions = await this.decisionReader.findAllActive();

    return activeDecisions.map((d) => ({
      decisionId: d.decisionId,
      title: d.title,
      rationale: d.rationale || d.context,
      status: d.status,
    }));
  }

  /**
   * Get all invariants
   *
   * @returns Invariant context views
   */
  private async getInvariants(): Promise<any[]> {
    if (!this.invariantReader) {
      return [];
    }

    const allInvariants = await this.invariantReader.findAll();

    // For Phase 3, include all invariants
    // Future optimization: could filter based on goal scope
    return allInvariants.map((inv: InvariantView) => ({
      invariantId: inv.invariantId,
      category: inv.title, // Use title as category for display
      description: inv.description,
    }));
  }

  /**
   * Get active guidelines
   *
   * @returns Guideline context views
   */
  private async getGuidelines(): Promise<any[]> {
    if (!this.guidelineReader) {
      return [];
    }

    const allGuidelines = await this.guidelineReader.findAll();

    // Filter out removed guidelines
    const activeGuidelines = allGuidelines.filter((g) => !g.isRemoved);

    return activeGuidelines.map((g) => ({
      guidelineId: g.guidelineId,
      category: g.category,
      description: g.description,
    }));
  }

  /**
   * Get global architecture
   *
   * @returns Architecture view or undefined
   */
  private async getArchitecture(): Promise<any> {
    if (!this.architectureReader) {
      return undefined;
    }

    const architecture = await this.architectureReader.find();

    if (!architecture) {
      return undefined;
    }

    // Map to embedded architecture format for consistency
    return {
      description: architecture.description,
      organization: architecture.organization,
      patterns: architecture.patterns,
      principles: architecture.principles,
    };
  }

  /**
   * Get relations for scoped components
   *
   * @param components - Filtered components
   * @returns Relation context views
   */
  private async getRelations(components: any[]): Promise<any[]> {
    if (!this.relationReader || components.length === 0) {
      return [];
    }

    const componentIds = new Set(components.map((c: { componentId: string }) => c.componentId));
    const relations: any[] = [];

    // Get relations for each component
    for (const component of components) {
      // Relations where this component is the source
      const fromRelations = await this.relationReader.findByFromEntity(
        "component",
        component.componentId
      );

      // Relations where this component is the target
      const toRelations = await this.relationReader.findByToEntity(
        "component",
        component.componentId
      );

      // Filter to only include relations between scoped components
      const relevantFromRelations = fromRelations.filter(
        (r: { status: string; toEntityId: string }) => r.status === "active" && componentIds.has(r.toEntityId)
      );

      const relevantToRelations = toRelations.filter(
        (r: { status: string; fromEntityId: string }) => r.status === "active" && componentIds.has(r.fromEntityId)
      );

      relations.push(...relevantFromRelations, ...relevantToRelations);
    }

    // Deduplicate relations
    const uniqueRelations = Array.from(
      new Map(relations.map((r) => [r.relationId, r])).values()
    );

    return uniqueRelations.map((r) => ({
      fromEntityId: r.fromEntityId,
      toEntityId: r.toEntityId,
      relationType: r.relationType,
      description: r.description,
    }));
  }
}
