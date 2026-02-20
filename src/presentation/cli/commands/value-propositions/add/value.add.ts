/**
 * CLI Command: jumbo value add
 *
 * Adds a new value proposition to the project.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { AddValuePropositionRequest } from "../../../../../application/context/value-propositions/add/AddValuePropositionRequest.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Add a value proposition to the project",
  category: "project-knowledge",
  requiredOptions: [
    {
      flags: "--title <title>",
      description: "Short value description",
    },
    {
      flags: "--description <description>",
      description: "Detailed explanation of the value",
    },
    {
      flags: "--benefit <benefit>",
      description: "How this improves the situation",
    },
  ],
  options: [
    {
      flags: "--measurable-outcome <outcome>",
      description: "How success is measured (optional)",
    },
  ],
  examples: [
    {
      command:
        "jumbo value add --title 'Persistent context' --description 'Maintain context across sessions' --benefit 'Developers don\\'t lose work'",
      description: "Add a value proposition without measurable outcome",
    },
    {
      command:
        "jumbo value add --title 'Model-agnostic' --description 'Works with any LLM' --benefit 'Switch providers freely' --measurable-outcome 'Zero context loss'",
      description: "Add a value proposition with measurable outcome",
    },
  ],
  related: ["value update", "value remove"],
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function valueAdd(options: {
  title: string;
  description: string;
  benefit: string;
  measurableOutcome?: string;
}, container: IApplicationContainer) {
  const renderer = Renderer.getInstance();

  try {
    const request: AddValuePropositionRequest = {
      title: options.title,
      description: options.description,
      benefit: options.benefit,
      measurableOutcome: options.measurableOutcome,
    };

    const response = await container.addValuePropositionController.handle(request);

    const data: Record<string, string> = {
      valuePropositionId: response.valuePropositionId,
      title: response.title,
    };
    if (response.measurableOutcome) {
      data.measurableOutcome = response.measurableOutcome;
    }

    renderer.success("Value proposition added successfully", data);
  } catch (error) {
    renderer.error("Failed to add value proposition", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}
