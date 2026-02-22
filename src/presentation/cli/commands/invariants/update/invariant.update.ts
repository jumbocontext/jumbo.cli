/**
 * CLI Command: jumbo invariant update
 *
 * Updates an existing invariant with new property values.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Update an existing invariant",
  category: "solution",
  requiredOptions: [
    {
      flags: "-i, --id <id>",
      description: "ID of the invariant to update"
    }
  ],
  options: [
    {
      flags: "-t, --title <title>",
      description: "Updated invariant title"
    },
    {
      flags: "-d, --description <description>",
      description: "Updated description"
    },
    {
      flags: "-r, --rationale <rationale>",
      description: "Updated rationale"
    },
    {
      flags: "--enforcement <enforcement>",
      description: "Updated enforcement method"
    }
  ],
  examples: [
    {
      command: "jumbo invariant update --id inv_123 --title 'New Title'",
      description: "Update only the title"
    },
    {
      command: "jumbo invariant update --id inv_123 --title 'HTTPS Only' --description 'All API calls must use HTTPS' --enforcement 'API gateway config'",
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
  id: string;
  title?: string;
  description?: string;
  rationale?: string;
  enforcement?: string;
}, container: IApplicationContainer) {
  const renderer = Renderer.getInstance();

  try {
    const response = await container.updateInvariantController.handle({
      invariantId: options.id,
      ...(options.title !== undefined && { title: options.title }),
      ...(options.description !== undefined && { description: options.description }),
      ...(options.rationale !== undefined && { rationale: options.rationale }),
      ...(options.enforcement !== undefined && { enforcement: options.enforcement }),
    });

    // Success output
    const data: Record<string, string | number> = {
      invariantId: response.invariantId,
      updatedFields: response.updatedFields.join(", "),
    };

    if (response.title !== undefined) data.title = response.title;
    if (response.version !== undefined) data.version = response.version;

    renderer.success(
      `Invariant '${response.title || options.id}' updated`,
      data
    );
  } catch (error) {
    renderer.error("Failed to update invariant", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
