/**
 * Port interface for reading project state during update.
 * Used to check if project exists before update.
 */

import { ProjectView } from "../ProjectView.js";

export interface IProjectUpdateReader {
  /**
   * Retrieves the singleton project view.
   * Returns null if project hasn't been initialized.
   */
  getProject(): Promise<ProjectView | null>;
}
