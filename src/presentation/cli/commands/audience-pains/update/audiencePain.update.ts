/**
 * CLI Command: jumbo audience-pain update
 *
 * Updates an existing audience pain's details (title and/or description).
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { UpdateAudiencePainCommandHandler } from "../../../../../application/audience-pains/update/UpdateAudiencePainCommandHandler.js";
import { UpdateAudiencePainCommand } from "../../../../../application/audience-pains/update/UpdateAudiencePainCommand.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Update an existing audience pain's title or description",
  category: "project-knowledge",
  requiredOptions: [
    {
      flags: "--pain-id <painId>",
      description: "ID of the audience pain to update",
    },
  ],
  options: [
    {
      flags: "--title <title>",
      description: "Updated pain title",
    },
    {
      flags: "--description <description>",
      description: "Updated pain description",
    },
  ],
  examples: [
    {
      command:
        'jumbo audience-pain update --pain-id pain_123 --title "Context persistence challenge"',
      description: "Update pain title",
    },
    {
      command:
        'jumbo audience-pain update --pain-id pain_123 --description "New description"',
      description: "Update pain description",
    },
    {
      command:
        'jumbo audience-pain update --pain-id pain_123 --title "New title" --description "New description"',
      description: "Update both title and description",
    },
  ],
  related: ["audience pain add", "audience-pain resolve", "audience add"],
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function audiencePainUpdate(options: {
  painId: string;
  title?: string;
  description?: string;
}, container: IApplicationContainer) {
  const renderer = Renderer.getInstance();

  // Validate at least one field provided
  if (!options.title && !options.description) {
    renderer.error(
      "Must provide at least one field to update (--title or --description)"
    );
    process.exit(1);
  }

  try {
    // 1. Create command handler using container dependencies
    const commandHandler = new UpdateAudiencePainCommandHandler(
      container.audiencePainUpdatedEventStore,
      container.eventBus,
      container.audiencePainUpdatedProjector
    );

    // 2. Execute command
    const command: UpdateAudiencePainCommand = {
      painId: options.painId,
      title: options.title,
      description: options.description,
    };

    const result = await commandHandler.execute(command);

    // 3. Fetch updated view for display
    const view = await container.audiencePainUpdatedProjector.findById(result.painId);

    // Success output
    const data: Record<string, string> = {
      painId: result.painId,
    };

    if (view) {
      data.title = view.title;
      data.description = view.description;
      data.version = view.version.toString();
    }

    renderer.success(`Audience pain updated successfully.`, data);
  } catch (error) {
    renderer.error("Failed to update audience pain", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
