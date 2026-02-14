/**
 * CLI Command: jumbo dependency remove
 *
 * Removes a dependency from the project (transitions status to 'removed').
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { RemoveDependencyCommandHandler } from "../../../../../application/context/dependencies/remove/RemoveDependencyCommandHandler.js";
import { RemoveDependencyCommand } from "../../../../../application/context/dependencies/remove/RemoveDependencyCommand.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Remove a dependency from the project",
  category: "solution",
  requiredOptions: [
    {
      flags: "--dependency-id <dependencyId>",
      description: "ID of the dependency to remove"
    }
  ],
  options: [
    {
      flags: "--reason <reason>",
      description: "Reason for removing the dependency"
    }
  ],
  examples: [
    {
      command: "jumbo dependency remove --dependency-id dep_abc123",
      description: "Remove a dependency from the project"
    },
    {
      command: "jumbo dependency remove --dependency-id dep_abc123 --reason 'Migrated to MongoDB'",
      description: "Remove a dependency with a reason"
    }
  ],
  related: ["dependency add", "dependency update", "component remove"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function dependencyRemove(
  options: {
    dependencyId: string;
    reason?: string;
  },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    // 1. Create command handler using container dependencies
    const commandHandler = new RemoveDependencyCommandHandler(
      container.dependencyRemovedEventStore,
      container.dependencyRemovedEventStore,
      container.dependencyRemovedProjector,
      container.eventBus
    );

    // 2. Execute command
    const command: RemoveDependencyCommand = {
      dependencyId: options.dependencyId,
      reason: options.reason
    };

    const result = await commandHandler.execute(command);

    // 3. Fetch updated view for display
    const view = await container.dependencyRemovedProjector.findById(result.dependencyId);

    // Success output
    const data: Record<string, string | number> = {
      dependencyId: result.dependencyId,
      consumer: view?.consumerId || 'unknown',
      provider: view?.providerId || 'unknown',
      status: view?.status || 'removed',
    };
    if (options.reason) data.reason = options.reason;

    renderer.success(`Dependency '${view?.consumerId} → ${view?.providerId}' removed`, data);
  } catch (error) {
    renderer.error("Failed to remove dependency", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
