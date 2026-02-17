import { ProjectView } from "../ProjectView.js";
import { AudienceView } from "../../audiences/AudienceView.js";
import { AudiencePainView } from "../../audience-pains/AudiencePainView.js";

/**
 * ContextualProjectView - Composed project view with audiences and pains.
 *
 * Combines:
 * - project: The core ProjectView entity
 * - audiences: Active target audiences
 * - audiencePains: Active audience pain points
 *
 * Follows the Contextual*View convention for application-layer composed read models.
 * Reusable across session context, project queries, and any consumer needing
 * a project with its related audience data.
 */
export interface ContextualProjectView {
  readonly project: ProjectView;
  readonly audiences: ReadonlyArray<AudienceView>;
  readonly audiencePains: ReadonlyArray<AudiencePainView>;
}
