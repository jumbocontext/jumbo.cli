/**
 * CLI Command: jumbo guideline remove
 *
 * Marks a guideline as removed.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Remove an execution guideline",
  category: "solution",
  requiredOptions: [
    {
      flags: "-i, --id <id>",
      description: "ID of the guideline to remove",
    },
  ],
  options: [
    {
      flags: "-r, --reason <text>",
      description: "Reason for removal",
    },
  ],
  examples: [
    {
      command: "jumbo guideline remove --id gl_123",
      description: "Remove a guideline",
    },
    {
      command:
        "jumbo guideline remove --id gl_123 --reason 'Superseded by new testing framework'",
      description: "Remove a guideline with reason",
    },
  ],
  related: ["guideline add", "guideline update"],
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function guidelineRemove(options: {
  id: string;
  reason?: string;
}, container: IApplicationContainer) {
  const renderer = Renderer.getInstance();

  try {
    const response = await container.removeGuidelineController.handle({
      guidelineId: options.id,
      reason: options.reason,
    });

    // Success output
    const data: Record<string, string | number> = {
      guidelineId: response.guidelineId,
    };
    if (options.reason) {
      data.reason = options.reason;
    }

    renderer.success(
      `Guideline '${response.title}' removed successfully`,
      data
    );
  } catch (error) {
    renderer.error("Failed to remove guideline", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
