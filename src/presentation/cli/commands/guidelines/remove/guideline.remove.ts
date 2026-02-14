/**
 * CLI Command: jumbo guideline remove
 *
 * Marks a guideline as removed.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { RemoveGuidelineCommandHandler } from "../../../../../application/context/guidelines/remove/RemoveGuidelineCommandHandler.js";
import { RemoveGuidelineCommand } from "../../../../../application/context/guidelines/remove/RemoveGuidelineCommand.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Remove an execution guideline",
  category: "solution",
  requiredOptions: [
    {
      flags: "--guideline-id <guidelineId>",
      description: "ID of the guideline to remove",
    },
  ],
  options: [
    {
      flags: "--reason <text>",
      description: "Reason for removal",
    },
  ],
  examples: [
    {
      command: "jumbo guideline remove --guideline-id gl_123",
      description: "Remove a guideline",
    },
    {
      command:
        "jumbo guideline remove --guideline-id gl_123 --reason 'Superseded by new testing framework'",
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
  guidelineId: string;
  reason?: string;
}, container: IApplicationContainer) {
  const renderer = Renderer.getInstance();

  try {
    // 1. Create command handler using container dependencies
    const commandHandler = new RemoveGuidelineCommandHandler(
      container.guidelineRemovedEventStore,
      container.guidelineRemovedEventStore,
      container.eventBus
    );

    // 2. Execute command
    const command: RemoveGuidelineCommand = {
      guidelineId: options.guidelineId,
      reason: options.reason,
    };
    const result = await commandHandler.execute(command);

    // 3. Fetch updated view for display
    const guideline = await container.guidelineRemovedProjector.findById(result.guidelineId, true);

    // Success output
    const data: Record<string, string | number> = {
      guidelineId: options.guidelineId,
    };
    if (options.reason) {
      data.reason = options.reason;
    }

    renderer.success(
      `Guideline '${guideline?.title || options.guidelineId}' removed successfully`,
      data
    );
  } catch (error) {
    renderer.error("Failed to remove guideline", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
