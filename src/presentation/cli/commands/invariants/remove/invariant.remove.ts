/**
 * CLI Command: jumbo invariant remove
 *
 * Removes an invariant from project knowledge.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { RemoveInvariantCommandHandler } from "../../../../../application/invariants/remove/RemoveInvariantCommandHandler.js";
import { RemoveInvariantCommand } from "../../../../../application/invariants/remove/RemoveInvariantCommand.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Remove an invariant from project knowledge",
  category: "solution",
  requiredOptions: [
    {
      flags: "--id <invariantId>",
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
    // 1. Get invariant details for confirmation message (before removal)
    const invariantView = await container.invariantRemovedProjector.findById(options.id);
    if (!invariantView) {
      renderer.error(`Invariant '${options.id}' not found`);
      process.exit(1);
    }

    // 2. Create command handler using container dependencies
    const commandHandler = new RemoveInvariantCommandHandler(
      container.invariantRemovedEventStore,
      container.invariantRemovedEventStore,
      container.invariantRemovedProjector,
      container.eventBus
    );

    // 3. Execute command
    const command: RemoveInvariantCommand = {
      invariantId: options.id
    };

    await commandHandler.execute(command);

    // 4. Success output
    renderer.success(`Invariant '${invariantView.title}' removed`, {
      invariantId: options.id,
      title: invariantView.title
    });
  } catch (error) {
    renderer.error("Failed to remove invariant", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
