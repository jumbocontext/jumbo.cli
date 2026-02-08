/**
 * ProjectSummaryView - Simplified view for banner display
 *
 * Used by GetProjectSummaryQueryHandler to provide minimal
 * project information for CLI banner rendering.
 */

export interface ProjectSummaryView {
  name: string;
  purpose: string | null;
}
