import { ProjectView } from "../ProjectView.js";
import { AudienceView } from "../../audiences/AudienceView.js";
import { AudiencePainView } from "../../audience-pains/AudiencePainView.js";
import { ValuePropositionView } from "../../value-propositions/ValuePropositionView.js";

/**
 * ContextualProjectView - Composed project view with audiences, pains, and value propositions.
 *
 * Combines:
 * - project: The core ProjectView entity
 * - audiences: Active target audiences
 * - audiencePains: Active audience pain points
 * - valuePropositions: Active value propositions
 *
 * Follows the Contextual*View convention for application-layer composed read models.
 * Available for consumers needing a project with its related audience and value data.
 * Session context no longer consumes this view — session start emits only project name and purpose.
 */
export interface ContextualProjectView {
  readonly project: ProjectView;
  readonly audiences: ReadonlyArray<AudienceView>;
  readonly audiencePains: ReadonlyArray<AudiencePainView>;
  readonly valuePropositions: ReadonlyArray<ValuePropositionView>;
}
