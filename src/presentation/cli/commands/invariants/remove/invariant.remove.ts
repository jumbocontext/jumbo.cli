/**
 * CLI Command: jumbo invariant remove
 *
 * Removes an invariant from project knowledge.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Remove an invariant from project knowledge",
  category: "solution",
  requiredOptions: [
    {
      flags: "-i, --id <id>",
      description: "Invariant ID to remove"
    }
  ],
  examples: [
    {
      command: "jumbo invariant remove --id inv_001",
      description: "Remove an invariant by ID"
    }
  ],
  related: ["invariant add", "invariant update"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function invariantRemove(options: {
  id: string;
}, container: IApplicationContainer) {
  const renderer = Renderer.getInstance();

  try {
    const response = await container.removeInvariantController.handle({
      invariantId: options.id,
    });

    // Success output
    renderer.success(`Invariant '${response.title}' removed`, {
      invariantId: response.invariantId,
      title: response.title
    });
  } catch (error) {
    renderer.error("Failed to remove invariant", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
