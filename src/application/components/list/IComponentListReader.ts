/**
 * Port interface for listing components from the projection store.
 * Used by ListComponentsQueryHandler to retrieve component list with filtering.
 */

import { ComponentView } from "../ComponentView.js";

export type ComponentStatusFilter = "active" | "deprecated" | "removed" | "all";

export interface IComponentListReader {
  /**
   * Retrieves all components, optionally filtered by status.
   * @param status - Filter by status, or "all" for all components
   * @returns Array of component views ordered by name
   */
  findAll(status?: ComponentStatusFilter): Promise<ComponentView[]>;
}
