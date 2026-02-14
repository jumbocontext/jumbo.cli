/**
 * CLI Command: jumbo relation remove
 *
 * Removes an existing relation from the knowledge graph.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { RemoveRelationCommandHandler } from "../../../../../application/context/relations/remove/RemoveRelationCommandHandler.js";
import { RemoveRelationCommand } from "../../../../../application/context/relations/remove/RemoveRelationCommand.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Remove a relation from the knowledge graph",
  category: "relations",
  requiredOptions: [
    {
      flags: "--relation-id <relationId>",
      description: "ID of the relation to remove"
    }
  ],
  options: [
    {
      flags: "--reason <reason>",
      description: "Reason for removing the relation"
    }
  ],
  examples: [
    {
      command: "jumbo relation remove --relation-id rel_abc123",
      description: "Remove a relation"
    },
    {
      command: 'jumbo relation remove --relation-id rel_abc123 --reason "Component was deprecated"',
      description: "Remove a relation with a reason"
    }
  ],
  related: ["relation add"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function relationRemove(options: {
  relationId: string;
  reason?: string;
}, container: IApplicationContainer) {
  const renderer = Renderer.getInstance();

  try {
    // 1. Fetch relation details before removal for display
    const relation = await container.relationRemovedProjector.findById(options.relationId);

    // 2. Create command handler using container dependencies
    const commandHandler = new RemoveRelationCommandHandler(
      container.relationRemovedEventStore,
      container.relationRemovedEventStore,
      container.eventBus,
      container.relationRemovedProjector
    );

    // 3. Execute command
    const command: RemoveRelationCommand = {
      relationId: options.relationId,
      reason: options.reason
    };

    await commandHandler.execute(command);

    // Success output
    const data: Record<string, string> = {
      relationId: options.relationId,
    };

    if (relation) {
      data.from = `${relation.fromEntityType}:${relation.fromEntityId}`;
      data.relationType = relation.relationType;
      data.to = `${relation.toEntityType}:${relation.toEntityId}`;
    }

    if (options.reason) {
      data.reason = options.reason;
    }

    renderer.success("Relation removed successfully", data);
  } catch (error) {
    renderer.error("Failed to remove relation", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
