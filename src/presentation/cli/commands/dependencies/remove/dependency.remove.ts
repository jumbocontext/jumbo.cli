/**
 * CLI Command: jumbo dependency remove
 *
 * Removes a dependency from the project (transitions status to 'removed').
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { RemoveDependencyRequest } from "../../../../../application/context/dependencies/remove/RemoveDependencyRequest.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Remove a dependency from the project",
  category: "solution",
  requiredOptions: [
    {
      flags: "-i, --id <id>",
      description: "ID of the dependency to remove"
    }
  ],
  options: [
    {
      flags: "-r, --reason <reason>",
      description: "Reason for removing the dependency"
    }
  ],
  examples: [
    {
      command: "jumbo dependency remove --id dep_abc123",
      description: "Remove a dependency from the project"
    },
    {
      command: "jumbo dependency remove --id dep_abc123 --reason 'Migrated to MongoDB'",
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
    id: string;
    reason?: string;
  },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    const request: RemoveDependencyRequest = {
      dependencyId: options.id,
      reason: options.reason,
    };

    const response = await container.removeDependencyController.handle(request);

    // Success output
    const data: Record<string, string | number> = {
      dependencyId: response.dependencyId,
      consumer: response.consumer,
      provider: response.provider,
      status: response.status,
    };
    if (response.reason) data.reason = response.reason;

    renderer.success(`Dependency '${response.consumer} → ${response.provider}' removed`, data);
  } catch (error) {
    renderer.error("Failed to remove dependency", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
