/**
 * ProjectSummaryView - Simplified view for banner display
 *
 * Used by GetProjectSummaryQueryHandler to provide minimal
 * project information for CLI banner rendering.
 */

import { ProjectLifecycleState } from "./ProjectLifecycleState.js";

export interface ProjectSummaryView {
  name: string;
  purpose: string | null;
  lifecycleState: ProjectLifecycleState;
}
