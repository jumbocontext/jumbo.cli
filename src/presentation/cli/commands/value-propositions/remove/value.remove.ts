/**
 * CLI Command: jumbo value remove
 *
 * Removes a value proposition from the project.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Remove a value proposition from the project",
  category: "project-knowledge",
  requiredOptions: [
    {
      flags: "-i, --id <id>",
      description: "ID of the value proposition to remove",
    },
  ],
  examples: [
    {
      command: "jumbo value remove --id value_abc123",
      description: "Remove a value proposition by ID",
    },
  ],
  related: ["value add", "value update"],
  requiresProject: true
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function valueRemove(options: {
  id: string;
}, container: IApplicationContainer) {
  const renderer = Renderer.getInstance();

  try {
    const response = await container.removeValuePropositionController.handle({
      valuePropositionId: options.id,
    });

    // Success output
    renderer.success("Value proposition removed successfully", {
      valuePropositionId: response.valuePropositionId,
      title: response.title,
    });
  } catch (error) {
    renderer.error("Failed to remove value proposition", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
