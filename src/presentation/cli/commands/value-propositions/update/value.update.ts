/**
 * CLI Command: jumbo value update
 *
 * Updates an existing value proposition in the project.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { UpdateValuePropositionCommandHandler } from "../../../../../application/context/value-propositions/update/UpdateValuePropositionCommandHandler.js";
import { UpdateValuePropositionCommand } from "../../../../../application/context/value-propositions/update/UpdateValuePropositionCommand.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Update an existing value proposition",
  category: "project-knowledge",
  requiredOptions: [
    {
      flags: "--id <id>",
      description: "ID of the value proposition to update",
    },
  ],
  options: [
    {
      flags: "--title <title>",
      description: "Updated title (max 100 chars)",
    },
    {
      flags: "--description <description>",
      description: "Updated description (max 1000 chars)",
    },
    {
      flags: "--benefit <benefit>",
      description: "Updated benefit (max 500 chars)",
    },
    {
      flags: "--measurable-outcome <measurableOutcome>",
      description: "Updated measurable outcome (max 500 chars)",
    },
    {
      flags: "--clear-measurable-outcome",
      description: "Clear the measurable outcome field",
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
    // 1. Create command handler using container dependencies
    const commandHandler = new UpdateValuePropositionCommandHandler(
      container.valuePropositionUpdatedEventStore,
      container.eventBus,
      container.valuePropositionUpdatedProjector
    );

    // 2. Build command
    const command: UpdateValuePropositionCommand = {
      id: options.id,
      title: options.title,
      description: options.description,
      benefit: options.benefit,
      measurableOutcome: options.clearMeasurableOutcome
        ? null
        : options.measurableOutcome,
    };

    // 3. Execute command
    const result = await commandHandler.execute(command);

    // 4. Get updated view for display
    const updatedView = await container.valuePropositionUpdatedProjector.findById(result.valuePropositionId);

    // Success output
    const data: Record<string, string> = {
      valuePropositionId: result.valuePropositionId,
    };

    if (updatedView) {
      data.title = updatedView.title;
      data.version = updatedView.version.toString();
    }

    renderer.success("Value proposition updated successfully", data);
  } catch (error) {
    renderer.error("Failed to update value proposition", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
