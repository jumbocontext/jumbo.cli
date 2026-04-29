/**
 * CLI Command: jumbo invariant add
 *
 * Captures a non-negotiable requirement or boundary for the project.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Add a project invariant (non-negotiable requirement)",
  category: "solution",
  requiredOptions: [
    {
      flags: "-t, --title <title>",
      description: "Invariant title"
    },
    {
      flags: "-d, --description <description>",
      description: "Detailed description of the invariant"
    }
  ],
  options: [
    {
      flags: "-r, --rationale <rationale>",
      description: "Why this invariant is non-negotiable"
    }
  ],
  examples: [
    {
      command: "jumbo invariant add --title 'HTTPS only' --description 'All API calls must use HTTPS'",
      description: "Add a security invariant"
    },
    {
      command: "jumbo invariant add --title '80% test coverage' --description 'All code must have at least 80% test coverage' --rationale 'Ensures code quality'",
      description: "Add a testing invariant with rationale"
    }
  ],
  related: ["invariant update", "invariant remove", "guideline add"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function invariantAdd(options: {
  title: string;
  description: string;
  rationale?: string;
}, container: IApplicationContainer) {
  const renderer = Renderer.getInstance();

  try {
    const { invariantId } = await container.addInvariantController.handle({
      title: options.title,
      description: options.description,
      rationale: options.rationale,
    });

    const data: Record<string, string> = {
      invariantId,
      title: options.title,
    };
    if (options.rationale) {
      data.rationale = options.rationale;
    }

    renderer.success(`Invariant '${options.title}' added`, data);
  } catch (error) {
    renderer.error("Failed to add invariant", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}
