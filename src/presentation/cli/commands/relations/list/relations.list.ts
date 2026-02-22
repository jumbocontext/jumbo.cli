/**
 * CLI Command: jumbo relations list
 *
 * Lists all knowledge graph relations with optional entity filtering.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { RelationView } from "../../../../../application/context/relations/RelationView.js";
import { EntityTypeValue } from "../../../../../domain/relations/Constants.js";
import { GetRelationsRequest } from "../../../../../application/context/relations/get/GetRelationsRequest.js";

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
      description: "Filter by entity ID (requires --entity-type)",
    },
    {
      flags: "-s, --status <status>",
      description: "Filter by status: active (default), removed, or all",
    },
  ],
  examples: [
    { command: "jumbo relations list", description: "List all active relations" },
    { command: "jumbo relations list --entity-type goal", description: "List relations involving goals" },
    { command: "jumbo relations list --entity-type component --entity-id comp_123", description: "List relations for a specific component" },
    { command: "jumbo relations list --status all", description: "List all relations including removed" },
    { command: "jumbo relations list --format json", description: "List relations as JSON" },
  ],
  related: ["relation add", "relation remove"],
};

function formatRelationText(relation: RelationView): void {
  console.log(`${relation.fromEntityType}:${relation.fromEntityId} --[${relation.relationType}]--> ${relation.toEntityType}:${relation.toEntityId}`);
  console.log(`  ${relation.description}`);
  if (relation.strength) {
    console.log(`  Strength: ${relation.strength}`);
  }
  console.log(`  ID: ${relation.relationId}`);
  console.log("");
}

export async function relationsList(
  options: { entityType?: string; entityId?: string; status?: string },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    const request: GetRelationsRequest = {
      entityType: options.entityType as EntityTypeValue | undefined,
      entityId: options.entityId,
      status: (options.status as "active" | "removed" | "all") ?? "active",
    };
    const { relations } = await container.getRelationsController.handle(request);

    if (relations.length === 0) {
      const filterMsg = options.entityType ? ` involving ${options.entityType}` : "";
      renderer.info(`No relations found${filterMsg}. Use 'jumbo relation add' to add one.`);
      return;
    }

    const config = renderer.getConfig();

    if (config.format === "text") {
      const filterLabel = options.entityType
        ? ` (${options.entityType}${options.entityId ? ':' + options.entityId : ''})`
        : "";
      console.log(`\nRelations${filterLabel} (${relations.length}):\n`);
      for (const relation of relations) {
        formatRelationText(relation);
      }
    } else {
      const data = {
        count: relations.length,
        filter: {
          entityType: options.entityType ?? null,
          entityId: options.entityId ?? null,
          status: options.status ?? "active",
        },
        relations: relations.map((r) => ({
          relationId: r.relationId,
          fromEntityType: r.fromEntityType,
          fromEntityId: r.fromEntityId,
          toEntityType: r.toEntityType,
          toEntityId: r.toEntityId,
          relationType: r.relationType,
          strength: r.strength,
          description: r.description,
          status: r.status,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        })),
      };
      renderer.data(data);
    }
  } catch (error) {
    renderer.error("Failed to list relations", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}
