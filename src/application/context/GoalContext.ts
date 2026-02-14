import { GoalView } from "../context/goals/GoalView.js";
import { ArchitectureView } from "../context/architecture/ArchitectureView.js";
import { RelatedComponent } from "./RelatedComponent.js";
import { RelatedDependency } from "./RelatedDependency.js";
import { RelatedDecision } from "./RelatedDecision.js";
import { RelatedInvariant } from "./RelatedInvariant.js";
import { RelatedGuideline } from "./RelatedGuideline.js";

/**
 * GoalContext - Core relation-based context for a goal.
 *
 * Assembled at query time from:
 * - Goal (core entity)
 * - Relations (edges in knowledge graph)
 * - Related entities (fetched via batch readers)
 *
 * All arrays are guaranteed non-null and contain no null items.
 * Related entities include relation metadata (type + description)
 * to provide context about WHY the relation exists.
 *
 * Callers can map this to specific views:
 * - StartGoalContextView (enriched with LLM prompts)
 * - ReviewGoalContextView (enriched with review-specific data)
 * - etc.
 */
export interface GoalContext {
  readonly goal: GoalView;
  readonly components: ReadonlyArray<RelatedComponent>;
  readonly dependencies: ReadonlyArray<RelatedDependency>;
  readonly decisions: ReadonlyArray<RelatedDecision>;
  readonly invariants: ReadonlyArray<RelatedInvariant>;
  readonly guidelines: ReadonlyArray<RelatedGuideline>;
  readonly architecture: ArchitectureView | null;
}
