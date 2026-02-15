/**
 * ShowComponentQueryHandler - Query handler for showing a single component with its relations.
 *
 * Pure query operation - no state changes, no events.
 * Fetches component details by ID or name, then fetches all relations
 * where the component is either source or target.
 */

import { ShowComponentQuery } from "./ShowComponentQuery.js";
import { ComponentView } from "../ComponentView.js";
import { RelationView } from "../../relations/RelationView.js";
import { IComponentReader } from "../get/IComponentReader.js";
import { IRelationViewReader } from "../../relations/get/IRelationViewReader.js";

export interface ShowComponentResult {
  readonly component: ComponentView;
  readonly relations: RelationView[];
}

export class ShowComponentQueryHandler {
  constructor(
    private readonly componentReader: IComponentReader,
    private readonly relationViewReader: IRelationViewReader
  ) {}

  async execute(query: ShowComponentQuery): Promise<ShowComponentResult> {
    const component = query.componentId
      ? await this.componentReader.findById(query.componentId)
      : query.name
        ? await this.componentReader.findByName(query.name)
        : null;

    if (!component) {
      const identifier = query.componentId || query.name;
      throw new Error(`Component not found: ${identifier}`);
    }

    const relations = await this.relationViewReader.findAll({
      entityType: "component",
      entityId: component.componentId,
      status: "active",
    });

    return { component, relations };
  }
}
