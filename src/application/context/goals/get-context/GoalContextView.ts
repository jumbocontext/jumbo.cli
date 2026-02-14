import { GoalView } from "../GoalView.js";

/**
 * @deprecated This file is part of the legacy embedded context approach.
 *
 * It will be replaced by the relation-based context aggregation system
 * being built in the context/ namespace (Phase 7 of namespace remodel).
 *
 * DO NOT use this file as a pattern for new code. It remains only to support
 * the strangler fig migration pattern - keeping the old implementation working
 * while building the new system in parallel.
 */

/**
 * ArchitectureContextView - Architecture information for goal context
 *
 * NOTE: This type is defined here temporarily during the strangler fig migration.
 * It was moved from EmbeddedContextTypes.ts (which was deleted) to eliminate
 * embedded context from the Goal domain model.
 *
 * This is NOT a valid pattern to follow - context view types should be defined
 * in their own namespace, not alongside deprecated code. This exception exists
 * only to keep the build working during the migration.
 */
export interface ArchitectureContextView {
  readonly description: string;
  readonly organization: string;
  readonly patterns?: string[];
  readonly principles?: string[];
}

/**
 * ComponentContextView - Component information for goal context
 */
export interface ComponentContextView {
  readonly componentId: string;
  readonly name: string;
  readonly description: string;
  readonly status: string;
}

/**
 * DependencyContextView - Dependency information for goal context
 */
export interface DependencyContextView {
  readonly dependencyId: string;
  readonly name: string;
  readonly version?: string;
  readonly purpose: string;
}

/**
 * DecisionContextView - Decision information for goal context
 */
export interface DecisionContextView {
  readonly decisionId: string;
  readonly title: string;
  readonly rationale: string;
  readonly status: string;
}

/**
 * InvariantContextView - Invariant information for goal context
 */
export interface InvariantContextView {
  readonly invariantId: string;
  readonly category: string;
  readonly description: string;
}

/**
 * GuidelineContextView - Guideline information for goal context
 */
export interface GuidelineContextView {
  readonly guidelineId: string;
  readonly category: string;
  readonly description: string;
}

/**
 * RelationContextView - Relation information for goal context
 */
export interface RelationContextView {
  readonly fromEntityId: string;
  readonly toEntityId: string;
  readonly relationType: string;
  readonly description?: string;
}

/**
 * GoalContextView - Complete context for a goal
 *
 * Represents all context needed when starting a goal:
 * - Category 1: Work (Goal details)
 * - Category 2: Solution (Components, dependencies, decisions, architecture)
 * - Category 3: Invariants & Boundaries
 * - Category 4: Execution Guidelines
 * - Category 5: Relations
 *
 * All data filtered by goal.scopeIn and goal.scopeOut for token optimization.
 */
export interface GoalContextView {
  // Category 1: Work - The goal itself
  readonly goal: GoalView;

  // Category 2: Solution - Technical context
  readonly components: ComponentContextView[];
  readonly dependencies: DependencyContextView[];
  readonly decisions: DecisionContextView[];
  readonly architecture?: ArchitectureContextView;

  // Category 3: Invariants (boundaries already in goal.boundaries)
  readonly invariants: InvariantContextView[];

  // Category 4: Execution Guidelines
  readonly guidelines: GuidelineContextView[];

  // Category 5: Relations
  readonly relations: RelationContextView[];
}
