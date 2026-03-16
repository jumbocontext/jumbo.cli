/**
 * CLI Command: jumbo value update
 *
 * Updates an existing value proposition in the project.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { UpdateValuePropositionRequest } from "../../../../../application/context/value-propositions/update/UpdateValuePropositionRequest.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Update an existing value proposition",
  category: "project-knowledge",
  requiredOptions: [
    {
      flags: "-i, --id <id>",
      description: "ID of the value proposition to update",
    },
  ],
  options: [
    {
      flags: "-t, --title <title>",
      description: "Updated title, max 100 chars (at least one field required)",
    },
    {
      flags: "-d, --description <description>",
      description: "Updated description, max 1000 chars (at least one field required)",
    },
    {
      flags: "--benefit <benefit>",
      description: "Updated benefit, max 500 chars (at least one field required)",
    },
    {
      flags: "--measurable-outcome <measurableOutcome>",
      description: "Updated measurable outcome, max 500 chars (at least one field required)",
    },
    {
      flags: "--clear-measurable-outcome",
      description: "Clear the measurable outcome field (at least one field required)",
    },
  ],
  examples: [
    {
      command: "jumbo value update --id value_123 --title 'New Title'",
      description: "Update just the title",
    },
    {
      command:
        "jumbo value update --id value_123 --description 'Updated description' --benefit 'New benefit'",
      description: "Update multiple fields",
    },
    {
      command: "jumbo value update --id value_123 --clear-measurable-outcome",
      description: "Clear the measurable outcome field",
    },
  ],
  related: ["value add", "value remove"],
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function valueUpdate(options: {
  id: string;
  title?: string;
  description?: string;
  benefit?: string;
  measurableOutcome?: string;
  clearMeasurableOutcome?: boolean;
}, container: IApplicationContainer) {
  const renderer = Renderer.getInstance();

  // Validate at least one field provided
  if (!options.title && !options.description && !options.benefit &&
      !options.measurableOutcome && !options.clearMeasurableOutcome) {
    renderer.error(
      "Must provide at least one field to update (--title, --description, --benefit, --measurable-outcome, or --clear-measurable-outcome)"
    );
    process.exit(1);
  }

  try {
    const request: UpdateValuePropositionRequest = {
      id: options.id,
      title: options.title,
      description: options.description,
      benefit: options.benefit,
      measurableOutcome: options.clearMeasurableOutcome
        ? null
        : options.measurableOutcome,
    };

    const response = await container.updateValuePropositionController.handle(request);

    const data: Record<string, string> = {
      valuePropositionId: response.valuePropositionId,
    };

    if (response.title) {
      data.title = response.title;
    }
    if (response.version !== undefined) {
      data.version = response.version.toString();
    }

    renderer.success("Value proposition updated successfully", data);
  } catch (error) {
    renderer.error("Failed to update value proposition", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
