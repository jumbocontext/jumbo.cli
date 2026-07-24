import { FindRelationPathRequest } from "../../../../../application/context/relations/path/FindRelationPathRequest.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import {
  EntityTypeValue,
  RelationStrengthValue,
} from "../../../../../domain/relations/Constants.js";
import { RelationDirection } from "../../../../../application/context/relations/get/RelationDirection.js";
import { RelationStatusFilter } from "../../../../../application/context/relations/get/RelationStatusFilter.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { RenderData } from "../../../rendering/types.js";
import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { RelationPathOutputBuilder } from "./RelationPathOutputBuilder.js";

export const metadata: CommandMetadata = {
  description: "Find one bounded shortest path between two relation endpoints",
  category: "relations",
  requiredOptions: [
    { flags: "--from-id <fromId>", description: "Starting entity ID" },
    { flags: "--to-id <toId>", description: "Destination entity ID" },
  ],
  options: [
    {
      flags: "--from-type <fromType>",
      description: "Starting entity type (inferred when the ID is unique)",
    },
    {
      flags: "--to-type <toType>",
      description: "Destination entity type (inferred when the ID is unique)",
    },
    {
      flags: "--max-depth <maxDepth>",
      description: "Maximum path depth from 1 through 5",
      default: 5,
    },
    {
      flags: "-d, --direction <direction>",
      description: "Direction: in, out, or both",
      default: "both",
    },
    { flags: "--relation-type <type>", description: "Filter by relation type" },
    {
      flags: "--entity-type <type>",
      description: "Filter each traversed opposite endpoint by entity type",
    },
    {
      flags: "--strength <strength>",
      description: "Filter by strength: strong, medium, or weak",
    },
    {
      flags: "-s, --status <status>",
      description: "Filter by status: active, deactivated, removed, or all",
      default: "active",
    },
  ],
  examples: [
    {
      command:
        "jumbo relations path --from-type goal --from-id goal_123 --to-type dependency --to-id dep_456",
      description: "Explain the shortest connection between two typed memories",
    },
    {
      command:
        "jumbo relations path --from-id goal_123 --to-id comp_456 --direction out --max-depth 3 --format json",
      description:
        "Resolve unique endpoint types and return an outgoing path as JSON",
    },
  ],
  related: ["relations traverse", "relations list", "relation add"],
  requiresProject: true,
};

export async function relationsPath(
  options: {
    fromId: string;
    fromType?: string;
    toId: string;
    toType?: string;
    maxDepth?: string;
    direction?: string;
    relationType?: string;
    entityType?: string;
    strength?: string;
    status?: string;
  },
  container: IApplicationContainer,
): Promise<void> {
  const renderer = Renderer.getInstance();
  const outputBuilder = new RelationPathOutputBuilder();

  try {
    const request: FindRelationPathRequest = {
      fromEntityId: options.fromId,
      fromEntityType: options.fromType as EntityTypeValue | undefined,
      toEntityId: options.toId,
      toEntityType: options.toType as EntityTypeValue | undefined,
      maxDepth: Number(options.maxDepth ?? 5),
      direction: (options.direction as RelationDirection | undefined) ?? "both",
      relationType: options.relationType,
      relatedEntityType: options.entityType as EntityTypeValue | undefined,
      strength: options.strength as RelationStrengthValue | undefined,
      status: (options.status as RelationStatusFilter | undefined) ?? "active",
    };
    const result = await container.findRelationPathController.handle(request);

    if (renderer.getConfig().format === "text") {
      renderer.info(outputBuilder.build(result).toHumanReadable());
    } else {
      const output = outputBuilder.buildStructuredOutput(result);
      const dataSection = output
        .getSections()
        .find((section) => section.type === "data");
      if (dataSection) renderer.data(dataSection.content as RenderData);
    }
  } catch (error) {
    const output = outputBuilder.buildFailureError(
      error instanceof Error ? error : String(error),
    );
    if (renderer.getConfig().format === "text") {
      renderer.error(output.toHumanReadable());
    } else {
      const dataSection = output
        .getSections()
        .find((section) => section.type === "data");
      if (dataSection) renderer.data(dataSection.content as RenderData);
    }
    process.exit(1);
  }
}
