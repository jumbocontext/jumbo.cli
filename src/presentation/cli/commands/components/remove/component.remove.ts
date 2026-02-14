/**
 * CLI Command: jumbo component remove
 *
 * Marks a component as removed from the system.
 * Component must be deprecated before removal.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { RemoveComponentCommandHandler } from "../../../../../application/context/components/remove/RemoveComponentCommandHandler.js";
import { RemoveComponentCommand } from "../../../../../application/context/components/remove/RemoveComponentCommand.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Mark a component as removed from the system",
  category: "solution",
  requiredOptions: [
    {
      flags: "--component-id <componentId>",
      description: "ID of the component to remove"
    }
  ],
  examples: [
    {
      command: "jumbo component remove --component-id comp_123",
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
    componentId: string;
  },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    // 1. Create command handler using container dependencies
    const commandHandler = new RemoveComponentCommandHandler(
      container.componentRemovedEventStore,
      container.eventBus,
      container.componentRemovedProjector
    );

    // 2. Execute command
    const command: RemoveComponentCommand = {
      componentId: options.componentId
    };

    await commandHandler.execute(command);

    // 3. Fetch updated view for display
    const view = await container.componentRemovedProjector.findById(options.componentId);

    // Success output
    const data: Record<string, string | number> = {
      componentId: options.componentId,
      name: view?.name || 'Unknown',
      status: view?.status || 'removed'
    };

    renderer.success(`Component '${view?.name || options.componentId}' marked as removed`, data);
  } catch (error) {
    renderer.error("Failed to remove component", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
