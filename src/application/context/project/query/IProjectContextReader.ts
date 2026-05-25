/**
 * Port interface for reading project state in query contexts.
 * Used by GetGoalContextQueryHandler and GetProjectSummaryQueryHandler.
 */

import { ProjectView } from "../ProjectView.js";
import { ProjectKnowledgeInventoryView } from "../ProjectKnowledgeInventoryView.js";
import { ProjectLifecycleState } from "../ProjectLifecycleState.js";

export interface IProjectContextReader {
  /**
   * Retrieves the singleton project view.
   * Returns null if project hasn't been initialized.
   */
  getProject(): Promise<ProjectView | null>;

  /**
   * Retrieves the derived lifecycle state for cockpit routing.
   */
  getProjectLifecycleState(): Promise<ProjectLifecycleState>;

  /**
   * Retrieves the read-model inventory used to derive lifecycle state.
   */
  getProjectKnowledgeInventory(): Promise<ProjectKnowledgeInventoryView>;
}
