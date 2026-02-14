import { GoalView } from "../context/goals/GoalView.js";
import { ArchitectureView } from "../context/architecture/ArchitectureView.js";
import { RelatedComponent } from "./RelatedComponent.js";
import { RelatedDependency } from "./RelatedDependency.js";
import { RelatedDecision } from "./RelatedDecision.js";
import { RelatedInvariant } from "./RelatedInvariant.js";
import { RelatedGuideline } from "./RelatedGuideline.js";

/**
 * GoalContextView - Presentation-layer view of goal context.
 *
 * Stable interface for the presentation layer that uses Related* types.
 * This gives us flexibility to:
 * - Filter/obfuscate sensitive properties
 * - Add presentation-specific enrichments
 * - Evolve independently from GoalContext
 *
 * Mapped from GoalContext by GoalContextViewMapper.
 */
export interface GoalContextView {
  readonly goal: GoalView;
  readonly components: ReadonlyArray<RelatedComponent>;
  readonly dependencies: ReadonlyArray<RelatedDependency>;
  readonly decisions: ReadonlyArray<RelatedDecision>;
  readonly invariants: ReadonlyArray<RelatedInvariant>;
  readonly guidelines: ReadonlyArray<RelatedGuideline>;
  readonly architecture: ArchitectureView | null;
}
