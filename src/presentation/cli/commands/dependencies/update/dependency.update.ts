/**
 * CLI Command: jumbo dependency update
 *
 * Updates an existing Dependency with new endpoint, contract, or status.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
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
      flags: "-i, --id <id>",
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
      flags: "-s, --status <status>",
      description: "Updated status (active, deprecated, removed)"
    }
  ],
  examples: [
    {
      command: "jumbo dependency update --id dep_123 --endpoint '/api/v2/users'",
      description: "Update dependency endpoint"
    },
    {
      command: "jumbo dependency update --id dep_123 --status deprecated",
      description: "Mark dependency as deprecated"
    },
    {
      command: "jumbo dependency update --id dep_123 --contract 'REST API' --status active",
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
    id: string;
    endpoint?: string;
    contract?: string;
    status?: DependencyStatusType;
  },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    const response = await container.updateDependencyController.handle({
      dependencyId: options.id,
      endpoint: options.endpoint,
      contract: options.contract,
      status: options.status,
    });

    // Success output
    const data: Record<string, string | number> = {
      dependencyId: response.dependencyId,
    };
    if (response.consumerId) data.consumer = response.consumerId;
    if (response.providerId) data.provider = response.providerId;
    if (response.endpoint) data.endpoint = response.endpoint;
    if (response.contract) data.contract = response.contract;
    if (response.status) data.status = response.status;

    renderer.success(`Dependency updated`, data);
  } catch (error) {
    renderer.error("Failed to update dependency", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
