/**
 * CLI Command: jumbo relation remove
 *
 * Removes an existing relation from the knowledge graph.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { RemoveRelationRequest } from "../../../../../application/context/relations/remove/RemoveRelationRequest.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Remove a relation from the knowledge graph",
  category: "relations",
  requiredOptions: [
    {
      flags: "-i, --id <id>",
      description: "ID of the relation to remove"
    }
  ],
  options: [
    {
      flags: "-r, --reason <reason>",
      description: "Reason for removing the relation"
    }
  ],
  examples: [
    {
      command: "jumbo relation remove --id rel_abc123",
      description: "Remove a relation"
    },
    {
      command: 'jumbo relation remove --id rel_abc123 --reason "Component was deprecated"',
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
  id: string;
  reason?: string;
}, container: IApplicationContainer) {
  const renderer = Renderer.getInstance();

  try {
    const request: RemoveRelationRequest = {
      relationId: options.id,
      reason: options.reason,
    };

    const response = await container.removeRelationController.handle(request);

    const data: Record<string, string> = {
      relationId: response.relationId,
    };

    if (response.from) {
      data.from = response.from;
    }
    if (response.relationType) {
      data.relationType = response.relationType;
    }
    if (response.to) {
      data.to = response.to;
    }
    if (options.reason) {
      data.reason = options.reason;
    }

    renderer.success("Relation removed successfully", data);
  } catch (error) {
    renderer.error("Failed to remove relation", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}
