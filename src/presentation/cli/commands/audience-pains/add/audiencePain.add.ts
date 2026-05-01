/**
 * CLI Command: jumbo audience-pain add
 *
 * Captures a pain point that the project addresses for its audience.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Add an audience pain point that the project addresses",
  category: "project-knowledge",
  requiredOptions: [
    {
      flags: "-t, --title <title>",
      description: "Brief title of the pain point",
    },
    {
      flags: "-d, --description <description>",
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
  related: ["audience pain update", "audience add"],
  requiresProject: true
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
    const response = await container.addAudiencePainController.handle({
      title: options.title,
      description: options.description,
    });

    const data: Record<string, string> = {
      painId: response.painId,
      title: response.title,
      description: response.description,
    };

    if (response.version !== null) {
      data.version = response.version.toString();
    }

    renderer.success(`Audience pain '${response.title}' captured successfully.`, data);
  } catch (error) {
    renderer.error("Failed to add audience pain", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}
