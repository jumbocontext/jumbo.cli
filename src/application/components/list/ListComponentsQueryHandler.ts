/**
 * ListComponentsQueryHandler - Query handler for listing software components.
 *
 * This is a standard CQRS query handler that provides read access to
 * the Component projection for listing purposes with optional filtering.
 *
 * Usage:
 *   const query = new ListComponentsQueryHandler(componentListReader);
 *   const components = await query.execute();
 *   const activeComponents = await query.execute("active");
 *
 * Returns:
 *   - Array of ComponentView ordered by name
 *   - Empty array if no components exist
 */

import { IComponentListReader, ComponentStatusFilter } from "./IComponentListReader.js";
import { ComponentView } from "../ComponentView.js";

export class ListComponentsQueryHandler {
  constructor(
    private readonly componentListReader: IComponentListReader
  ) {}

  /**
   * Execute query to retrieve components.
   *
   * @param status - Optional filter by status ("active", "deprecated", "removed", "all")
   * @returns Array of ComponentView sorted by name
   */
  async execute(status: ComponentStatusFilter = "all"): Promise<ComponentView[]> {
    return this.componentListReader.findAll(status);
  }
}
