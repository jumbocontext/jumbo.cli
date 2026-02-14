/**
 * Port interface for reading a single component from the projection store.
 * Used by ShowComponentQueryHandler to retrieve a component by ID or name.
 */

import { ComponentView } from "../ComponentView.js";

export interface IComponentReader {
  /**
   * Find a component by its ID.
   * @returns The component view, or null if not found
   */
  findById(componentId: string): Promise<ComponentView | null>;

  /**
   * Find a component by its name.
   * @returns The component view, or null if not found
   */
  findByName(name: string): Promise<ComponentView | null>;
}
