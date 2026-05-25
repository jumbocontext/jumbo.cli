import { ProjectView } from "../../ProjectView.js";
import { AudienceView } from "../../../audiences/AudienceView.js";
import { AudiencePainView } from "../../../audience-pains/AudiencePainView.js";
import { ValuePropositionView } from "../../../value-propositions/ValuePropositionView.js";

/**
 * ProjectNorthStarView - Project alignment packet for goal design and definition.
 *
 * Combines:
 * - project: The core ProjectView entity
 * - audiences: Active target audiences
 * - audiencePains: Active audience pain points
 * - valuePropositions: Active value propositions
 */
export interface ProjectNorthStarView {
  readonly project: ProjectView;
  readonly audiences: ReadonlyArray<AudienceView>;
  readonly audiencePains: ReadonlyArray<AudiencePainView>;
  readonly valuePropositions: ReadonlyArray<ValuePropositionView>;
}
