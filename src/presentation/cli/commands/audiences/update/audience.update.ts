/**
 * CLI Command: jumbo audience update
 *
 * Updates an existing audience's details.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { AudiencePriorityType } from "../../../../../domain/audiences/Constants.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Update an existing audience",
  category: "project-knowledge",
  requiredOptions: [
    {
      flags: "-i, --id <id>",
      description: "ID of the audience to update",
    },
  ],
  options: [
    {
      flags: "-n, --name <name>",
      description: "Updated audience name",
    },
    {
      flags: "-d, --description <description>",
      description: "Updated audience description",
    },
    {
      flags: "--priority <priority>",
      description: "Updated priority (primary, secondary, tertiary)",
    },
  ],
  examples: [
    {
      command:
        "jumbo audience update --id audience-123 --name 'Updated Name'",
      description: "Update audience name",
    },
    {
      command:
        'jumbo audience update --id audience-123 --name "Software Engineers" --description "Professional developers" --priority primary',
      description: "Update multiple fields",
    },
  ],
  related: ["audience add", "audience remove"],
  requiresProject: true
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function audienceUpdate(options: {
  id: string;
  name?: string;
  description?: string;
  priority?: AudiencePriorityType;
}, container: IApplicationContainer) {
  const renderer = Renderer.getInstance();

  try {
    const response = await container.updateAudienceController.handle({
      audienceId: options.id,
      name: options.name,
      description: options.description,
      priority: options.priority,
    });

    // Success output
    const data: Record<string, string> = {
      audienceId: response.audienceId,
    };

    if (options.name) data.name = options.name;
    if (options.description) data.description = options.description;
    if (options.priority) data.priority = options.priority;

    renderer.success(
      `Audience '${options.name || options.id}' updated successfully.`,
      data
    );
  } catch (error) {
    renderer.error("Failed to update audience", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}
