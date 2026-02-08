/**
 * CLI Command: jumbo audience remove
 *
 * Removes a target audience from the project (soft-delete).
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { RemoveAudienceCommandHandler } from "../../../../../application/audiences/remove/RemoveAudienceCommandHandler.js";
import { RemoveAudienceCommand } from "../../../../../application/audiences/remove/RemoveAudienceCommand.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Remove an audience from the project",
  category: "project-knowledge",
  requiredOptions: [
    {
      flags: "--audience-id <audienceId>",
      description: "ID of the audience to remove",
    },
  ],
  options: [
    {
      flags: "--reason <reason>",
      description: "Reason for removing the audience",
    },
  ],
  examples: [
    {
      command: 'jumbo audience remove --audience-id "audience-123"',
      description: "Remove an audience",
    },
    {
      command:
        'jumbo audience remove --audience-id "audience-123" --reason "No longer in target market"',
      description: "Remove an audience with a reason",
    },
  ],
  related: ["audience add", "audience update", "audience pain add"],
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function audienceRemove(options: {
  audienceId: string;
  reason?: string;
}, container: IApplicationContainer) {
  const renderer = Renderer.getInstance();

  try {
    // 1. Get audience name before removal (for confirmation message)
    const view = await container.audienceRemovedProjector.findById(options.audienceId);
    if (!view) {
      renderer.error(`Audience '${options.audienceId}' not found.`);
      process.exit(1);
    }

    // 2. Create command handler using container dependencies
    const commandHandler = new RemoveAudienceCommandHandler(
      container.audienceRemovedEventStore,
      container.eventBus,
      container.audienceRemovedProjector
    );

    // 3. Execute command
    const command: RemoveAudienceCommand = {
      audienceId: options.audienceId,
      reason: options.reason,
    };

    await commandHandler.execute(command);

    // Success output
    const data: Record<string, string> = {
      audienceId: options.audienceId,
      name: view.name,
    };

    if (options.reason) {
      data.reason = options.reason;
    }

    renderer.success(`Audience '${view.name}' removed successfully.`, data);
  } catch (error) {
    renderer.error("Failed to remove audience", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
