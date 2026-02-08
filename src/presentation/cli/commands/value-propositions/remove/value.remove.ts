/**
 * CLI Command: jumbo value remove
 *
 * Removes a value proposition from the project.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { RemoveValuePropositionCommandHandler } from "../../../../../application/value-propositions/remove/RemoveValuePropositionCommandHandler.js";
import { RemoveValuePropositionCommand } from "../../../../../application/value-propositions/remove/RemoveValuePropositionCommand.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Remove a value proposition from the project",
  category: "project-knowledge",
  requiredOptions: [
    {
      flags: "--value-proposition-id <valuePropositionId>",
      description: "ID of the value proposition to remove",
    },
  ],
  examples: [
    {
      command: "jumbo value remove --value-proposition-id value_abc123",
      description: "Remove a value proposition by ID",
    },
  ],
  related: ["value add", "value update"],
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function valueRemove(options: {
  valuePropositionId: string;
}, container: IApplicationContainer) {
  const renderer = Renderer.getInstance();

  try {
    // 1. Create command handler using container dependencies
    const commandHandler = new RemoveValuePropositionCommandHandler(
      container.valuePropositionRemovedEventStore,
      container.eventBus,
      container.valuePropositionRemovedProjector
    );

    // 2. Execute command
    const command: RemoveValuePropositionCommand = {
      valuePropositionId: options.valuePropositionId,
    };
    const result = await commandHandler.execute(command);

    // Success output
    renderer.success("Value proposition removed successfully", {
      valuePropositionId: result.valuePropositionId,
      title: result.title,
    });
  } catch (error) {
    renderer.error("Failed to remove value proposition", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
