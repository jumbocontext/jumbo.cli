/**
 * CLI Command: jumbo relations list
 *
 * Lists all knowledge graph relations with optional entity filtering.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { RenderData } from "../../../rendering/types.js";
import { EntityTypeValue, RelationStrengthValue } from "../../../../../domain/relations/Constants.js";
import { GetRelationsRequest } from "../../../../../application/context/relations/get/GetRelationsRequest.js";
import { RelationListOutputBuilder } from './RelationListOutputBuilder.js';
import { RelationDirection } from "../../../../../application/context/relations/get/RelationDirection.js";
import { RelationStatusFilter } from "../../../../../application/context/relations/get/RelationStatusFilter.js";

export const metadata: CommandMetadata = {
  description: "List all knowledge graph relations",
  category: "relations",
  options: [
    {
      flags: "--entity-type <type>",
      description: "Filter by entity type (e.g., goal, decision, component)",
    },
    {
      flags: "--entity-id <id>",
      description: "Filter by entity ID",
    },
    {
      flags: "-d, --direction <direction>",
      description: "Filter relative to the entity: in, out, or both (default)",
    },
    {
      flags: "--relation-type <type>",
      description: "Filter by relation type",
    },
    {
      flags: "--related-entity-type <type>",
      description: "Filter by the type at the opposite endpoint",
    },
    {
      flags: "--strength <strength>",
      description: "Filter by strength: strong, medium, or weak",
    },
    {
      flags: "-s, --status <status>",
      description: "Filter by status: active (default), deactivated, removed, or all",
    },
  ],
  examples: [
    { command: "jumbo relations list", description: "List all active relations" },
    { command: "jumbo relations list --entity-type goal", description: "List relations involving goals" },
    { command: "jumbo relations list --entity-type component --entity-id comp_123", description: "List relations for a specific component" },
    { command: "jumbo relations list --status deactivated", description: "List only deactivated relations" },
    { command: "jumbo relations list --status all", description: "List all relations including removed" },
    { command: "jumbo relations list --format json", description: "List relations as JSON" },
  ],
  related: ["relation add", "relation remove"],
  requiresProject: true
};

export async function relationsList(
  options: {
    entityType?: string;
    entityId?: string;
    direction?: string;
    relationType?: string;
    relatedEntityType?: string;
    strength?: string;
    status?: string;
  },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    const request: GetRelationsRequest = {
      entity: options.entityType && options.entityId
        ? { entityType: options.entityType as EntityTypeValue, entityId: options.entityId }
        : undefined,
      entityType: options.entityType as EntityTypeValue | undefined,
      entityId: options.entityId,
      direction: options.direction as RelationDirection | undefined,
      relationType: options.relationType,
      relatedEntityType: options.relatedEntityType as EntityTypeValue | undefined,
      strength: options.strength as RelationStrengthValue | undefined,
      status: (options.status as RelationStatusFilter | undefined) ?? "active",
    };
    const { relations } = await container.getRelationsController.handle(request);

    const config = renderer.getConfig();
    const outputBuilder = new RelationListOutputBuilder();

    if (config.format === "text") {
      const filterLabel = options.entityType
        ? `${options.entityType}${options.entityId ? ':' + options.entityId : ''}`
        : undefined;
      const output = outputBuilder.build(relations, filterLabel);
      renderer.info(output.toHumanReadable());
    } else {
      const output = outputBuilder.buildStructuredOutput(relations, request);
      const sections = output.getSections();
      const dataSection = sections.find(s => s.type === "data");
      if (dataSection) renderer.data(dataSection.content as RenderData);
    }
  } catch (error) {
    const output = new RelationListOutputBuilder().buildFailureError(
      error instanceof Error ? error : String(error)
    );
    const config = renderer.getConfig();
    if (config.format === "text") {
      renderer.error(output.toHumanReadable());
    } else {
      const dataSection = output.getSections().find((section) => section.type === "data");
      if (dataSection) renderer.data(dataSection.content as RenderData);
    }
    process.exit(1);
  }
}
