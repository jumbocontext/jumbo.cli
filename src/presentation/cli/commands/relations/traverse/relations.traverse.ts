import { EntityTypeValue, RelationStrengthValue } from "../../../../../domain/relations/Constants.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { RelationDirection } from "../../../../../application/context/relations/get/RelationDirection.js";
import { RelationStatusFilter } from "../../../../../application/context/relations/get/RelationStatusFilter.js";
import { TraverseRelationsRequest } from "../../../../../application/context/relations/traverse/TraverseRelationsRequest.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { RenderData } from "../../../rendering/types.js";
import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { RelationTraverseOutputBuilder } from "./RelationTraverseOutputBuilder.js";

export const metadata: CommandMetadata = {
  description: "Traverse bounded relation context from an entity",
  category: "relations",
  requiredOptions: [
    { flags: "-i, --id <id>", description: "Entity ID at the traversal root" },
  ],
  options: [
    { flags: "--entity-type <type>", description: "Root entity type (inferred when the ID is unique)" },
    { flags: "--depth <depth>", description: "Traversal depth from 1 through 5", default: 1 },
    { flags: "-d, --direction <direction>", description: "Direction: in, out, or both", default: "both" },
    { flags: "--relation-type <type>", description: "Filter by relation type" },
    { flags: "--related-entity-type <type>", description: "Filter each expansion by opposite endpoint type" },
    { flags: "--strength <strength>", description: "Filter by strength: strong, medium, or weak" },
    { flags: "-s, --status <status>", description: "Filter by status: active, deactivated, removed, or all", default: "active" },
    { flags: "--limit <limit>", description: "Maximum number of distinct edges from 1 through 1000", default: 100 },
  ],
  examples: [
    { command: "jumbo relations traverse --id goal_123", description: "Inspect the immediate active context" },
    { command: "jumbo relations traverse --id goal_123 --entity-type goal --depth 3", description: "Traverse three hops from a typed root" },
    { command: "jumbo relations traverse --id comp_123 --direction out --relation-type requires --format json", description: "Return filtered outgoing context as JSON" },
  ],
  related: ["relations list", "relation add", "relation remove"],
  requiresProject: true,
};

export async function relationsTraverse(
  options: {
    id: string;
    entityType?: string;
    depth?: string;
    direction?: string;
    relationType?: string;
    relatedEntityType?: string;
    strength?: string;
    status?: string;
    limit?: string;
  },
  container: IApplicationContainer
): Promise<void> {
  const renderer = Renderer.getInstance();
  const outputBuilder = new RelationTraverseOutputBuilder();

  try {
    const request: TraverseRelationsRequest = {
      entityId: options.id,
      entityType: options.entityType as EntityTypeValue | undefined,
      depth: Number(options.depth ?? 1),
      direction: (options.direction as RelationDirection | undefined) ?? "both",
      relationType: options.relationType,
      relatedEntityType: options.relatedEntityType as EntityTypeValue | undefined,
      strength: options.strength as RelationStrengthValue | undefined,
      status: (options.status as RelationStatusFilter | undefined) ?? "active",
      limit: Number(options.limit ?? 100),
    };
    const result = await container.traverseRelationsController.handle(request);

    if (renderer.getConfig().format === "text") {
      renderer.info(outputBuilder.build(result).toHumanReadable());
    } else {
      const output = outputBuilder.buildStructuredOutput(result);
      const dataSection = output.getSections().find((section) => section.type === "data");
      if (dataSection) renderer.data(dataSection.content as RenderData);
    }
  } catch (error) {
    const output = outputBuilder.buildFailureError(error instanceof Error ? error : String(error));
    if (renderer.getConfig().format === "text") {
      renderer.error(output.toHumanReadable());
    } else {
      const dataSection = output.getSections().find((section) => section.type === "data");
      if (dataSection) renderer.data(dataSection.content as RenderData);
    }
    process.exit(1);
  }
}
