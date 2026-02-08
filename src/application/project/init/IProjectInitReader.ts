/**
 * Port interface for reading project state during initialization.
 * Used to check if project already exists.
 */

import { ProjectView } from "../ProjectView.js";

export interface IProjectInitReader {
  /**
   * Retrieves the singleton project view.
   * Returns null if project hasn't been initialized.
   */
  getProject(): Promise<ProjectView | null>;
}
