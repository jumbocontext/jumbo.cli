/**
 * Port interface for reading project state in query contexts.
 * Used by GetGoalContextQueryHandler and GetProjectSummaryQueryHandler.
 */

import { ProjectView } from "../ProjectView.js";

export interface IProjectContextReader {
  /**
   * Retrieves the singleton project view.
   * Returns null if project hasn't been initialized.
   */
  getProject(): Promise<ProjectView | null>;
}
