/**
 * CLI Command: jumbo audience-pain add
 *
 * Captures a pain point that the project addresses for its audience.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { AddAudiencePainCommandHandler } from "../../../../../application/context/audience-pains/add/AddAudiencePainCommandHandler.js";
import { AddAudiencePainCommand } from "../../../../../application/context/audience-pains/add/AddAudiencePainCommand.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Add an audience pain point that the project addresses",
  category: "project-knowledge",
  requiredOptions: [
    {
      flags: "--title <title>",
      description: "Brief title of the pain point",
    },
    {
      flags: "--description <description>",
      description: "Detailed description of the problem",
    },
  ],
  examples: [
    {
      command:
        'jumbo audience-pain add --title "Context loss" --description "LLMs lose context between sessions"',
      description: "Add a pain point about context management",
    },
    {
      command:
        'jumbo audience-pain add --title "Token costs" --description "High costs from repeated context loading"',
      description: "Add a pain point about efficiency",
    },
  ],
  related: ["audience pain update", "audience-pain resolve", "audience add"],
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function audiencePainAdd(options: {
  title: string;
  description: string;
}, container: IApplicationContainer) {
  const renderer = Renderer.getInstance();

  try {
    // 1. Create command handler using container dependencies
    const commandHandler = new AddAudiencePainCommandHandler(
      container.audiencePainAddedEventStore,
      container.eventBus
    );

    // 2. Execute command
    const command: AddAudiencePainCommand = {
      title: options.title,
      description: options.description,
    };

    const result = await commandHandler.execute(command);

    // 3. Fetch view for display
    const view = await container.audiencePainUpdatedProjector.findById(result.painId);

    // Success output
    const data: Record<string, string> = {
      painId: result.painId,
      title: options.title,
      description: options.description,
    };

    if (view) {
      data.version = view.version.toString();
    }

    renderer.success(`Audience pain '${options.title}' captured successfully.`, data);
  } catch (error) {
    renderer.error("Failed to add audience pain", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
