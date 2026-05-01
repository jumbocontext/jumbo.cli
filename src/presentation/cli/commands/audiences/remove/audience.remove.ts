/**
 * CLI Command: jumbo audience remove
 *
 * Removes a target audience from the project (soft-delete).
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Remove an audience from the project",
  category: "project-knowledge",
  requiredOptions: [
    {
      flags: "-i, --id <id>",
      description: "ID of the audience to remove",
    },
  ],
  options: [
    {
      flags: "-r, --reason <reason>",
      description: "Reason for removing the audience",
    },
  ],
  examples: [
    {
      command: 'jumbo audience remove --id "audience-123"',
      description: "Remove an audience",
    },
    {
      command:
        'jumbo audience remove --id "audience-123" --reason "No longer in target market"',
      description: "Remove an audience with a reason",
    },
  ],
  related: ["audience add", "audience update", "audience pain add"],
  requiresProject: true
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function audienceRemove(options: {
  id: string;
  reason?: string;
}, container: IApplicationContainer) {
  const renderer = Renderer.getInstance();

  try {
    const response = await container.removeAudienceController.handle({
      audienceId: options.id,
      reason: options.reason,
    });

    const data: Record<string, string> = {
      audienceId: response.audienceId,
      name: response.name,
    };

    if (options.reason) {
      data.reason = options.reason;
    }

    renderer.success(`Audience '${response.name}' removed successfully.`, data);
  } catch (error) {
    renderer.error("Failed to remove audience", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}
