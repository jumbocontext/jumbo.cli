/**
 * CLI Command: jumbo component remove
 *
 * Marks a component as removed from the system.
 * Component must be deprecated before removal.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Mark a component as removed from the system",
  category: "solution",
  requiredOptions: [
    {
      flags: "-i, --id <id>",
      description: "ID of the component to remove"
    }
  ],
  examples: [
    {
      command: "jumbo component remove --id comp_123",
      description: "Remove a deprecated component"
    }
  ],
  related: ["component deprecate", "component add", "component update"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function componentRemove(
  options: {
    id: string;
  },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    const response = await container.removeComponentController.handle({
      componentId: options.id,
    });

    const data: Record<string, string> = {
      componentId: response.componentId,
      name: response.name,
      status: response.status,
    };

    renderer.success(`Component '${response.name}' marked as removed`, data);
  } catch (error) {
    renderer.error("Failed to remove component", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}
