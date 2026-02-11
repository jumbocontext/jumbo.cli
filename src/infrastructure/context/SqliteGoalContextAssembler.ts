import { IGoalContextAssembler } from "../../application/context/IGoalContextAssembler.js";
import { GoalContext } from "../../application/context/GoalContext.js";
import { RelatedComponent } from "../../application/context/RelatedComponent.js";
import { RelatedDependency } from "../../application/context/RelatedDependency.js";
import { RelatedDecision } from "../../application/context/RelatedDecision.js";
import { RelatedInvariant } from "../../application/context/RelatedInvariant.js";
import { RelatedGuideline } from "../../application/context/RelatedGuideline.js";
import { IGoalContextReader } from "../../application/goals/get-context/IGoalContextReader.js";
import { IRelationReader } from "../../application/relations/IRelationReader.js";
import { IComponentContextReader } from "../../application/goals/get-context/IComponentContextReader.js";
import { IDependencyContextReader } from "../../application/goals/get-context/IDependencyContextReader.js";
import { IDecisionContextReader } from "../../application/goals/get-context/IDecisionContextReader.js";
import { IInvariantContextReader } from "../../application/goals/get-context/IInvariantContextReader.js";
import { IGuidelineContextReader } from "../../application/goals/get-context/IGuidelineContextReader.js";
import { IArchitectureReader } from "../../application/architecture/IArchitectureReader.js";
import { EntityType } from "../../domain/relations/Constants.js";

/**
 * SqliteGoalContextAssembler - Assembles goal context from relations and entity readers.
 *
 * Implements relation-based context aggregation:
 * 1. Query active relations from goal
 * 2. Group related entity IDs by type
 * 3. Batch fetch entities (one query per type)
 *    - If no relations exist, fetches ALL entities to provide complete project context
 *    - If relations exist, fetches only related entities
 * 4. Merge entity data with relation metadata
 *    - Default relation metadata used when no explicit relations exist
 * 5. Return complete GoalContext
 *
 * Performance: ~7 queries worst case (goal + relations + 6 entity types)
 * All queries are indexed. Can optimize with caching if needed.
 */
export class SqliteGoalContextAssembler implements IGoalContextAssembler {
  constructor(
    private readonly goalReader: IGoalContextReader,
    private readonly relationReader: IRelationReader,
    private readonly componentReader: IComponentContextReader,
    private readonly dependencyReader: IDependencyContextReader,
    private readonly decisionReader: IDecisionContextReader,
    private readonly invariantReader: IInvariantContextReader,
    private readonly guidelineReader: IGuidelineContextReader,
    private readonly architectureReader: IArchitectureReader
  ) {}

  async assembleContextForGoal(goalId: string): Promise<GoalContext | null> {
    // 1. Fetch goal
    const goal = await this.goalReader.findById(goalId);
    if (!goal) return null;

    // 2. Query relations where fromEntity = goal and status = active
    const allRelations = await this.relationReader.findByFromEntity(EntityType.GOAL, goalId);
    const relations = allRelations.filter(r => r.status === 'active');
    const hasNoRelations = relations.length === 0;

    // 3. Group related entity IDs by type
    const componentIds = relations
      .filter(r => r.toEntityType === EntityType.COMPONENT)
      .map(r => r.toEntityId);

    const dependencyIds = relations
      .filter(r => r.toEntityType === EntityType.DEPENDENCY)
      .map(r => r.toEntityId);

    const decisionIds = relations
      .filter(r => r.toEntityType === EntityType.DECISION)
      .map(r => r.toEntityId);

    const invariantIds = relations
      .filter(r => r.toEntityType === EntityType.INVARIANT)
      .map(r => r.toEntityId);

    const guidelineIds = relations
      .filter(r => r.toEntityType === EntityType.GUIDELINE)
      .map(r => r.toEntityId);

    const hasArchitectureRelation = relations.some(r => r.toEntityType === EntityType.ARCHITECTURE);

    // 4. Batch fetch entities (parallel queries)
    // If no relations exist, fetch all entities to provide complete project context
    const [
      componentViews,
      dependencyViews,
      decisionViews,
      invariantViews,
      guidelineViews,
      architectureView
    ] = await Promise.all([
      hasNoRelations ? this.componentReader.findAll() : this.componentReader.findByIds(componentIds),
      hasNoRelations ? this.dependencyReader.findAll() : this.dependencyReader.findByIds(dependencyIds),
      hasNoRelations ? this.decisionReader.findAllActive() : this.decisionReader.findByIds(decisionIds),
      hasNoRelations ? this.invariantReader.findAll() : this.invariantReader.findByIds(invariantIds),
      hasNoRelations ? this.guidelineReader.findAll() : this.guidelineReader.findByIds(guidelineIds),
      hasNoRelations || hasArchitectureRelation ? this.architectureReader.find() : Promise.resolve(null)
    ]);

    // 5. Merge entity data with relation metadata
    // If no relations exist, provide default metadata for all entities
    // Create lookup maps for O(1) relation metadata access
    const relationMap = new Map(
      relations.map(r => [`${r.toEntityType}:${r.toEntityId}`, r])
    );

    const components: RelatedComponent[] = componentViews
      .map((view): RelatedComponent | null => {
        const relation = relationMap.get(`${EntityType.COMPONENT}:${view.componentId}`);
        if (!relation && !hasNoRelations) return null;
        return {
          ...view,
          relationType: relation?.relationType ?? 'default',
          relationDescription: relation?.description ?? ''
        };
      })
      .filter((item: RelatedComponent | null): item is RelatedComponent => item !== null);

    const dependencies: RelatedDependency[] = dependencyViews
      .map((view): RelatedDependency | null => {
        const relation = relationMap.get(`${EntityType.DEPENDENCY}:${view.dependencyId}`);
        if (!relation && !hasNoRelations) return null;
        return {
          ...view,
          relationType: relation?.relationType ?? 'default',
          relationDescription: relation?.description ?? ''
        };
      })
      .filter((item: RelatedDependency | null): item is RelatedDependency => item !== null);

    const decisions: RelatedDecision[] = decisionViews
      .map((view): RelatedDecision | null => {
        const relation = relationMap.get(`${EntityType.DECISION}:${view.decisionId}`);
        if (!relation && !hasNoRelations) return null;
        return {
          ...view,
          relationType: relation?.relationType ?? 'default',
          relationDescription: relation?.description ?? ''
        };
      })
      .filter((item: RelatedDecision | null): item is RelatedDecision => item !== null);

    const invariants: RelatedInvariant[] = invariantViews
      .map((view): RelatedInvariant | null => {
        const relation = relationMap.get(`${EntityType.INVARIANT}:${view.invariantId}`);
        if (!relation && !hasNoRelations) return null;
        return {
          ...view,
          relationType: relation?.relationType ?? 'default',
          relationDescription: relation?.description ?? ''
        };
      })
      .filter((item: RelatedInvariant | null): item is RelatedInvariant => item !== null);

    const guidelines: RelatedGuideline[] = guidelineViews
      .map((view): RelatedGuideline | null => {
        const relation = relationMap.get(`${EntityType.GUIDELINE}:${view.guidelineId}`);
        if (!relation && !hasNoRelations) return null;
        return {
          ...view,
          relationType: relation?.relationType ?? 'default',
          relationDescription: relation?.description ?? ''
        };
      })
      .filter((item: RelatedGuideline | null): item is RelatedGuideline => item !== null);

    // 6. Return assembled context
    return {
      goal,
      components,
      dependencies,
      decisions,
      invariants,
      guidelines,
      architecture: architectureView
    };
  }
}
