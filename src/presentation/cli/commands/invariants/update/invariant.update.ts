/**
 * CLI Command: jumbo invariant update
 *
 * Updates an existing invariant with new property values.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { UpdateInvariantCommandHandler } from "../../../../../application/invariants/update/UpdateInvariantCommandHandler.js";
import { UpdateInvariantCommand } from "../../../../../application/invariants/update/UpdateInvariantCommand.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Update an existing invariant",
  category: "solution",
  requiredOptions: [
    {
      flags: "--invariant-id <invariantId>",
      description: "ID of the invariant to update"
    }
  ],
  options: [
    {
      flags: "--title <title>",
      description: "Updated invariant title"
    },
    {
      flags: "--description <description>",
      description: "Updated description"
    },
    {
      flags: "--rationale <rationale>",
      description: "Updated rationale"
    },
    {
      flags: "--enforcement <enforcement>",
      description: "Updated enforcement method"
    }
  ],
  examples: [
    {
      command: "jumbo invariant update --invariant-id inv_123 --title 'New Title'",
      description: "Update only the title"
    },
    {
      command: "jumbo invariant update --invariant-id inv_123 --title 'HTTPS Only' --description 'All API calls must use HTTPS' --enforcement 'API gateway config'",
      description: "Update multiple fields"
    }
  ],
  related: ["invariant add", "invariant remove"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function invariantUpdate(options: {
  invariantId: string;
  title?: string;
  description?: string;
  rationale?: string;
  enforcement?: string;
}, container: IApplicationContainer) {
  const renderer = Renderer.getInstance();

  try {
    // 1. Create command handler using container dependencies
    const commandHandler = new UpdateInvariantCommandHandler(
      container.invariantUpdatedEventStore,
      container.invariantUpdatedEventStore,
      container.eventBus
    );

    // 2. Execute command
    const command: UpdateInvariantCommand = {
      invariantId: options.invariantId,
      title: options.title,
      description: options.description,
      rationale: options.rationale,
      enforcement: options.enforcement,
    };

    await commandHandler.execute(command);

    // 3. Fetch updated view for display
    const view = await container.invariantUpdatedProjector.findById(options.invariantId);

    // Success output
    const data: Record<string, string> = {
      invariantId: options.invariantId,
    };
    if (options.title) data.title = options.title;
    if (options.description) data.description = options.description;
    if (options.rationale) data.rationale = options.rationale;
    if (options.enforcement) data.enforcement = options.enforcement;

    renderer.success(`Invariant '${view?.title || options.invariantId}' updated`, data);
  } catch (error) {
    renderer.error("Failed to update invariant", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
