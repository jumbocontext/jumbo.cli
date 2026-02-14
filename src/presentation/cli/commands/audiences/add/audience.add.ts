/**
 * CLI Command: jumbo audience add
 *
 * Registers a target audience for the project with priority level.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { AddAudienceCommandHandler } from "../../../../../application/context/audiences/add/AddAudienceCommandHandler.js";
import { AddAudienceCommand } from "../../../../../application/context/audiences/add/AddAudienceCommand.js";
import { AudiencePriorityType } from "../../../../../domain/audiences/Constants.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Add a target audience for the project",
  category: "project-knowledge",
  requiredOptions: [
    {
      flags: "--name <name>",
      description: "Audience name (e.g., 'Software Developers')",
    },
    {
      flags: "--description <description>",
      description: "Who they are and what they do",
    },
    {
      flags: "--priority <priority>",
      description: "Priority level (primary, secondary, tertiary)",
    },
  ],
  examples: [
    {
      command:
        'jumbo audience add --name "Software Developers" --description "Professional developers building LLM-powered applications" --priority primary',
      description: "Add a primary target audience",
    },
    {
      command:
        'jumbo audience add --name "DevOps Engineers" --description "Engineers managing CI/CD pipelines and deployment" --priority secondary',
      description: "Add a secondary audience",
    },
  ],
  related: ["audience update", "audience remove", "audience pain add"],
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function audienceAdd(options: {
  name: string;
  description: string;
  priority: AudiencePriorityType;
}, container: IApplicationContainer) {
  const renderer = Renderer.getInstance();

  try {
    // 1. Create command handler using container dependencies
    const commandHandler = new AddAudienceCommandHandler(
      container.audienceAddedEventStore,
      container.eventBus
    );

    // 2. Execute command
    const command: AddAudienceCommand = {
      name: options.name,
      description: options.description,
      priority: options.priority,
    };

    const result = await commandHandler.execute(command);

    // Success output
    const data: Record<string, string> = {
      audienceId: result.audienceId,
      name: options.name,
      priority: options.priority,
      description: options.description,
    };

    renderer.success(`Audience '${options.name}' added successfully.`, data);
  } catch (error) {
    renderer.error("Failed to add audience", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
