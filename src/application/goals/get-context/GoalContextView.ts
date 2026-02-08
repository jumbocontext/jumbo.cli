import { GoalView } from "../GoalView.js";
import { EmbeddedArchitecture } from "../../../domain/goals/EmbeddedContextTypes.js";

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
  readonly architecture?: EmbeddedArchitecture;

  // Category 3: Invariants (boundaries already in goal.boundaries)
  readonly invariants: InvariantContextView[];

  // Category 4: Execution Guidelines
  readonly guidelines: GuidelineContextView[];

  // Category 5: Relations
  readonly relations: RelationContextView[];
}
