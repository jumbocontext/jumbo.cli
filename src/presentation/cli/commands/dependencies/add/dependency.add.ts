/**
 * CLI Command: jumbo dependency add
 *
 * Adds a dependency relationship between two components in the system.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { AddDependencyRequest } from "../../../../../application/context/dependencies/add/AddDependencyRequest.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Add a dependency relationship between components",
  category: "solution",
  requiredOptions: [
    {
      flags: "--consumer-id <consumerId>",
      description: "Component that depends on another"
    },
    {
      flags: "--provider-id <providerId>",
      description: "Component being depended upon"
    }
  ],
  options: [
    {
      flags: "--endpoint <endpoint>",
      description: "Connection point (e.g., '/api/users', 'IUserRepository')"
    },
    {
      flags: "--contract <contract>",
      description: "Interface or contract specification"
    }
  ],
  examples: [
    {
      command: "jumbo dependency add --consumer-id UserService --provider-id DatabaseClient",
      description: "Add a basic dependency relationship"
    },
    {
      command: "jumbo dependency add --consumer-id UserController --provider-id AuthMiddleware --endpoint /api/auth/verify --contract IAuthVerifier",
      description: "Add a dependency with endpoint and contract"
    }
  ],
  related: ["dependency update", "dependency remove", "component add"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function dependencyAdd(
  options: {
    consumerId: string;
    providerId: string;
    endpoint?: string;
    contract?: string;
  },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    const request: AddDependencyRequest = {
      consumerId: options.consumerId,
      providerId: options.providerId,
      endpoint: options.endpoint,
      contract: options.contract,
    };

    const response = await container.addDependencyController.handle(request);

    // Success output
    const data: Record<string, string | number> = {
      dependencyId: response.dependencyId,
      consumer: options.consumerId,
      provider: options.providerId,
    };
    if (options.endpoint) data.endpoint = options.endpoint;
    if (options.contract) data.contract = options.contract;

    renderer.success(`Dependency '${options.consumerId} → ${options.providerId}' added`, data);
  } catch (error) {
    renderer.error("Failed to add dependency", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
