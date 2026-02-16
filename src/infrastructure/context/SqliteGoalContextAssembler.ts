import { IGoalContextAssembler } from "../../application/context/goals/get/IGoalContextAssembler.js";
import { ContextualGoalView } from "../../application/context/goals/get/ContextualGoalView.js";
import { RelatedContext } from "../../application/context/goals/get/RelatedContext.js";
import { IGoalReader } from "../../application/context/goals/start/IGoalReader.js";
import { IRelationReader } from "../../application/context/relations/IRelationReader.js";
import { IComponentViewReader } from "../../application/context/components/get/IComponentViewReader.js";
import { IDependencyViewReader } from "../../application/context/dependencies/get/IDependencyViewReader.js";
import { IDecisionViewReader } from "../../application/context/decisions/get/IDecisionViewReader.js";
import { IInvariantViewReader } from "../../application/context/invariants/get/IInvariantViewReader.js";
import { IGuidelineViewReader } from "../../application/context/guidelines/get/IGuidelineViewReader.js";
import { IArchitectureReader } from "../../application/context/architecture/IArchitectureReader.js";
import { ComponentView } from "../../application/context/components/ComponentView.js";
import { DependencyView } from "../../application/context/dependencies/DependencyView.js";
import { DecisionView } from "../../application/context/decisions/DecisionView.js";
import { InvariantView } from "../../application/context/invariants/InvariantView.js";
import { GuidelineView } from "../../application/context/guidelines/GuidelineView.js";
import { RelationView } from "../../application/context/relations/RelationView.js";
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
 * 4. Merge entity data with relation metadata into RelatedContext<T>
 *    - Default relation metadata used when no explicit relations exist
 * 5. Return complete ContextualGoalView (goal + context)
 *
 * Performance: ~7 queries worst case (goal + relations + 6 entity types)
 * All queries are indexed. Can optimize with caching if needed.
 */
export class SqliteGoalContextAssembler implements IGoalContextAssembler {
  constructor(
    private readonly goalReader: IGoalReader,
    private readonly relationReader: IRelationReader,
    private readonly componentReader: IComponentViewReader,
    private readonly dependencyReader: IDependencyViewReader,
    private readonly decisionReader: IDecisionViewReader,
    private readonly invariantReader: IInvariantViewReader,
    private readonly guidelineReader: IGuidelineViewReader,
    private readonly architectureReader: IArchitectureReader
  ) {}

  async assembleContextForGoal(goalId: string): Promise<ContextualGoalView | null> {
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
      hasNoRelations ? this.decisionReader.findAll("active") : this.decisionReader.findByIds(decisionIds),
      hasNoRelations ? this.invariantReader.findAll() : this.invariantReader.findByIds(invariantIds),
      hasNoRelations ? this.guidelineReader.findAll() : this.guidelineReader.findByIds(guidelineIds),
      hasNoRelations || hasArchitectureRelation ? this.architectureReader.find() : Promise.resolve(null)
    ]);

    // 5. Merge entity data with relation metadata into RelatedContext<T>
    // Create lookup maps for O(1) relation metadata access
    const relationMap = new Map(
      relations.map(r => [`${r.toEntityType}:${r.toEntityId}`, r])
    );

    const components = this.toRelatedContexts(
      componentViews, EntityType.COMPONENT, v => v.componentId, relationMap, hasNoRelations
    );

    const dependencies = this.toRelatedContexts(
      dependencyViews, EntityType.DEPENDENCY, v => v.dependencyId, relationMap, hasNoRelations
    );

    const decisions = this.toRelatedContexts(
      decisionViews, EntityType.DECISION, v => v.decisionId, relationMap, hasNoRelations
    );

    const invariants = this.toRelatedContexts(
      invariantViews, EntityType.INVARIANT, v => v.invariantId, relationMap, hasNoRelations
    );

    const guidelines = this.toRelatedContexts(
      guidelineViews, EntityType.GUIDELINE, v => v.guidelineId, relationMap, hasNoRelations
    );

    // 6. Return assembled ContextualGoalView
    return {
      goal,
      context: {
        components,
        dependencies,
        decisions,
        invariants,
        guidelines,
        architecture: architectureView
      }
    };
  }

  /**
   * Map entity views to RelatedContext<T> by merging with relation metadata.
   * Filters out entities without matching relations (unless hasNoRelations).
   */
  private toRelatedContexts<T>(
    views: T[],
    entityType: string,
    getId: (view: T) => string,
    relationMap: Map<string, RelationView>,
    hasNoRelations: boolean
  ): RelatedContext<T>[] {
    return views
      .map((view): RelatedContext<T> | null => {
        const relation = relationMap.get(`${entityType}:${getId(view)}`);
        if (!relation && !hasNoRelations) return null;
        return {
          entity: view,
          relationType: relation?.relationType ?? 'default',
          relationDescription: relation?.description ?? ''
        };
      })
      .filter((item): item is RelatedContext<T> => item !== null);
  }
}
