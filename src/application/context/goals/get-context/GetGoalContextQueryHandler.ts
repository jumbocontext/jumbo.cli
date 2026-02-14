import { IGoalContextReader } from "./IGoalContextReader.js";
import { GoalContextView } from "./GoalContextView.js";
import { IComponentContextReader } from "./IComponentContextReader.js";
import { IDependencyContextReader } from "./IDependencyContextReader.js";
import { IDecisionContextReader } from "./IDecisionContextReader.js";
import { IInvariantContextReader } from "./IInvariantContextReader.js";
import { IGuidelineContextReader } from "./IGuidelineContextReader.js";
import { IArchitectureReader } from "../../../../application/context/architecture/IArchitectureReader.js";
import { IRelationReader } from "../../relations/IRelationReader.js";
import { InvariantView } from "../../invariants/InvariantView.js";

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
    private readonly componentReader: IComponentContextReader,
    private readonly dependencyReader: IDependencyContextReader,
    private readonly decisionReader: IDecisionContextReader,
    private readonly invariantReader: IInvariantContextReader,
    private readonly guidelineReader: IGuidelineContextReader,
    private readonly architectureReader: IArchitectureReader,
    private readonly relationReader: IRelationReader
  ) {}

  /**
   * Execute the query to get goal context
   *
   * Always queries dedicated readers for all context categories.
   *
   * @param goalId - ID of the goal to get context for
   * @returns GoalContextView with all context data
   * @throws Error if goal not found
   */
  async execute(goalId: string): Promise<GoalContextView> {
    const goal = await this.goalReader.findById(goalId);

    if (!goal) {
      throw new Error(`Goal not found: ${goalId}`);
    }

    const components = await this.filterComponents(goal.scopeIn, goal.scopeOut);
    const dependencies = await this.filterDependencies(components);
    const decisions = await this.getDecisions();
    const invariants = await this.getInvariants();
    const guidelines = await this.getGuidelines();
    const architecture = await this.getArchitecture();
    const relations = await this.getRelations(components);

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
   * Filter components by scopeIn and scopeOut
   *
   * @param scopeIn - Component names to include
   * @param scopeOut - Component names to exclude
   * @returns Filtered component context views
   */
  private async filterComponents(scopeIn: string[], scopeOut: string[]): Promise<Array<{ componentId: string; name: string; description: string; status: string }>> {
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
    if (components.length === 0) {
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
    const allInvariants = await this.invariantReader.findAll();

    return allInvariants.map((inv: InvariantView) => ({
      invariantId: inv.invariantId,
      category: inv.title,
      description: inv.description,
    }));
  }

  /**
   * Get active guidelines
   *
   * @returns Guideline context views
   */
  private async getGuidelines(): Promise<any[]> {
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
    if (components.length === 0) {
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
