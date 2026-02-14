import { ArchitectureView } from "./context/architecture/ArchitectureView.js";
import { ComponentView } from "./context/components/ComponentView.js";
import { DecisionView } from "./context/decisions/DecisionView.js";
import { InvariantView } from "./context/invariants/InvariantView.js";
import { GuidelineView } from "./context/guidelines/GuidelineView.js";

/**
 * SolutionContextView - Aggregated view of all solution context
 *
 * Contains the full solution context that has been recorded in Jumbo:
 * - Architecture definition (patterns, principles, tech stack, data flow)
 * - Components (system parts and their responsibilities)
 * - Decisions (architectural and design choices with rationale)
 * - Invariants (non-negotiable constraints)
 * - Guidelines (coding standards and practices)
 *
 * Used by application layer services to make business decisions about
 * solution state (e.g., determining if a brownfield project needs priming).
 */
export interface SolutionContextView {
  readonly architecture: ArchitectureView | null;
  readonly components: ComponentView[];
  readonly decisions: DecisionView[];
  readonly invariants: InvariantView[];
  readonly guidelines: GuidelineView[];
}
