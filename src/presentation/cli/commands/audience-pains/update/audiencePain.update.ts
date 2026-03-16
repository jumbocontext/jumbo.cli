/**
 * CLI Command: jumbo audience-pain update
 *
 * Updates an existing audience pain's details (title and/or description).
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { UpdateAudiencePainRequest } from "../../../../../application/context/audience-pains/update/UpdateAudiencePainRequest.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Update an existing audience pain's title or description",
  category: "project-knowledge",
  requiredOptions: [
    {
      flags: "-i, --id <id>",
      description: "ID of the audience pain to update",
    },
  ],
  options: [
    {
      flags: "-t, --title <title>",
      description: "Updated pain title (at least one field required)",
    },
    {
      flags: "-d, --description <description>",
      description: "Updated pain description (at least one field required)",
    },
  ],
  examples: [
    {
      command:
        'jumbo audience-pain update --id pain_123 --title "Context persistence challenge"',
      description: "Update pain title",
    },
    {
      command:
        'jumbo audience-pain update --id pain_123 --description "New description"',
      description: "Update pain description",
    },
    {
      command:
        'jumbo audience-pain update --id pain_123 --title "New title" --description "New description"',
      description: "Update both title and description",
    },
  ],
  related: ["audience pain add", "audience add"],
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function audiencePainUpdate(options: {
  id: string;
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
    const request: UpdateAudiencePainRequest = {
      painId: options.id,
      title: options.title,
      description: options.description,
    };

    const { painId, view } = await container.updateAudiencePainController.handle(request);

    // Success output
    const data: Record<string, string> = {
      painId,
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
