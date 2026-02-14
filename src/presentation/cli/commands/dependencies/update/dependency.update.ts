/**
 * CLI Command: jumbo dependency update
 *
 * Updates an existing Dependency with new endpoint, contract, or status.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { UpdateDependencyCommandHandler } from "../../../../../application/context/dependencies/update/UpdateDependencyCommandHandler.js";
import { UpdateDependencyCommand } from "../../../../../application/context/dependencies/update/UpdateDependencyCommand.js";
import { DependencyStatusType } from "../../../../../domain/dependencies/Constants.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Update an existing dependency with new endpoint, contract, or status",
  category: "solution",
  requiredOptions: [
    {
      flags: "--dependency-id <dependencyId>",
      description: "ID of the dependency to update"
    }
  ],
  options: [
    {
      flags: "--endpoint <endpoint>",
      description: "Updated API endpoint or connection string"
    },
    {
      flags: "--contract <contract>",
      description: "Updated contract or interface definition"
    },
    {
      flags: "--status <status>",
      description: "Updated status (active, deprecated, removed)"
    }
  ],
  examples: [
    {
      command: "jumbo dependency update --dependency-id dep_123 --endpoint '/api/v2/users'",
      description: "Update dependency endpoint"
    },
    {
      command: "jumbo dependency update --dependency-id dep_123 --status deprecated",
      description: "Mark dependency as deprecated"
    },
    {
      command: "jumbo dependency update --dependency-id dep_123 --contract 'REST API' --status active",
      description: "Update multiple fields"
    }
  ],
  related: ["dependency add", "dependency remove", "component update"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function dependencyUpdate(
  options: {
    dependencyId: string;
    endpoint?: string;
    contract?: string;
    status?: DependencyStatusType;
  },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    // 1. Create command handler using container dependencies
    const commandHandler = new UpdateDependencyCommandHandler(
      container.dependencyUpdatedEventStore,
      container.dependencyUpdatedEventStore,
      container.dependencyUpdatedProjector,
      container.eventBus
    );

    // 2. Execute command
    const command: UpdateDependencyCommand = {
      id: options.dependencyId,
      endpoint: options.endpoint,
      contract: options.contract,
      status: options.status
    };

    const result = await commandHandler.execute(command);

    // 3. Fetch updated view for display
    const view = await container.dependencyUpdatedProjector.findById(result.dependencyId);

    // Success output
    const data: Record<string, string | number> = {
      dependencyId: result.dependencyId,
    };
    if (view) {
      data.consumer = view.consumerId;
      data.provider = view.providerId;
      if (view.endpoint) data.endpoint = view.endpoint;
      if (view.contract) data.contract = view.contract;
      data.status = view.status;
    }

    renderer.success(`Dependency updated`, data);
  } catch (error) {
    renderer.error("Failed to update dependency", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
