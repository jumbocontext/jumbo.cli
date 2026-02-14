/**
 * CLI Command: jumbo component deprecate
 *
 * Marks a component as deprecated when it's being phased out but not yet removed from the codebase.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { DeprecateComponentCommandHandler } from "../../../../../application/context/components/deprecate/DeprecateComponentCommandHandler.js";
import { DeprecateComponentCommand } from "../../../../../application/context/components/deprecate/DeprecateComponentCommand.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Mark a component as deprecated",
  category: "solution",
  requiredOptions: [
    {
      flags: "--component-id <componentId>",
      description: "ID of the component to deprecate"
    }
  ],
  options: [
    {
      flags: "--reason <reason>",
      description: "Reason for deprecation (max 500 chars)"
    }
  ],
  examples: [
    {
      command: "jumbo component deprecate --component-id comp_123",
      description: "Deprecate a component without specifying a reason"
    },
    {
      command: "jumbo component deprecate --component-id comp_123 --reason 'Replaced by NewAuthMiddleware'",
      description: "Deprecate a component with a reason"
    }
  ],
  related: ["component add", "component update", "component remove"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function componentDeprecate(
  options: {
    componentId: string;
    reason?: string;
  },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    // 1. Create command handler using container dependencies
    const commandHandler = new DeprecateComponentCommandHandler(
      container.componentDeprecatedEventStore,
      container.eventBus,
      container.componentDeprecatedProjector
    );

    // 2. Execute command
    const command: DeprecateComponentCommand = {
      componentId: options.componentId,
      reason: options.reason
    };

    await commandHandler.execute(command);

    // 3. Fetch updated view for display
    const view = await container.componentDeprecatedProjector.findById(options.componentId);

    // Success output
    const data: Record<string, string | number> = {
      componentId: options.componentId,
      name: view?.name || 'Unknown',
      status: view?.status || 'deprecated'
    };

    if (options.reason) data.reason = options.reason;

    renderer.success(`Component '${view?.name || options.componentId}' marked as deprecated`, data);
  } catch (error) {
    renderer.error("Failed to deprecate component", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
