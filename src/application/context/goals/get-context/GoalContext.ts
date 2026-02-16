import { ArchitectureView } from "../../architecture/ArchitectureView.js";
import { ComponentView } from "../../components/ComponentView.js";
import { DependencyView } from "../../dependencies/DependencyView.js";
import { DecisionView } from "../../decisions/DecisionView.js";
import { InvariantView } from "../../invariants/InvariantView.js";
import { GuidelineView } from "../../guidelines/GuidelineView.js";
import { RelatedContext } from "./RelatedContext.js";

/**
 * GoalContext - Pure relations container for a goal.
 *
 * Holds only the relation collections that provide context for a goal:
 * components, dependencies, decisions, invariants, guidelines, architecture.
 *
 * Does NOT contain the goal itself. The composed return type
 * ContextualGoalView pairs a GoalView with its GoalContext.
 *
 * All arrays are guaranteed non-null and contain no null items.
 * Related entities are wrapped in RelatedContext<T> to provide
 * relation metadata (type + description) about WHY the relation exists.
 */
export interface GoalContext {
  readonly components: ReadonlyArray<RelatedContext<ComponentView>>;
  readonly dependencies: ReadonlyArray<RelatedContext<DependencyView>>;
  readonly decisions: ReadonlyArray<RelatedContext<DecisionView>>;
  readonly invariants: ReadonlyArray<RelatedContext<InvariantView>>;
  readonly guidelines: ReadonlyArray<RelatedContext<GuidelineView>>;
  readonly architecture: ArchitectureView | null;
}
