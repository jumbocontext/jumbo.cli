/**
 * CLI Command: jumbo dependency add
 *
 * Registers an external dependency used by the project.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { AddDependencyRequest } from "../../../../../application/context/dependencies/add/AddDependencyRequest.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Register an external dependency",
  category: "solution",
  options: [
    {
      flags: "--name <name>",
      description: "Dependency display name"
    },
    {
      flags: "--ecosystem <ecosystem>",
      description: "Dependency ecosystem (e.g., npm, pip, maven)"
    },
    {
      flags: "--package-name <packageName>",
      description: "Package identifier in the ecosystem"
    },
    {
      flags: "--version-constraint <constraint>",
      description: "Optional version constraint (e.g., ^4.18.0)"
    },
    {
      flags: "--consumer-id <consumerId>",
      description: "Legacy: component that depends on another"
    },
    {
      flags: "--provider-id <providerId>",
      description: "Legacy: component being depended upon"
    },
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
      command: "jumbo dependency add --name Express --ecosystem npm --package-name express --version-constraint ^4.18.0",
      description: "Register an external dependency"
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
    name?: string;
    ecosystem?: string;
    packageName?: string;
    versionConstraint?: string;
    consumerId?: string;
    providerId?: string;
    endpoint?: string;
    contract?: string;
  },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    const request: AddDependencyRequest = {
      name: options.name,
      ecosystem: options.ecosystem,
      packageName: options.packageName,
      versionConstraint: options.versionConstraint,
      consumerId: options.consumerId,
      providerId: options.providerId,
      endpoint: options.endpoint,
      contract: options.contract,
    };

    const response = await container.addDependencyController.handle(request);

    // Success output
    const data: Record<string, string | number> = {
      dependencyId: response.dependencyId,
    };
    if (options.name) data.name = options.name;
    if (options.ecosystem) data.ecosystem = options.ecosystem;
    if (options.packageName) data.packageName = options.packageName;
    if (options.versionConstraint) data.versionConstraint = options.versionConstraint;
    if (options.consumerId) data.consumer = options.consumerId;
    if (options.providerId) data.provider = options.providerId;
    if (options.endpoint) data.endpoint = options.endpoint;
    if (options.contract) data.contract = options.contract;

    const dependencyLabel = options.name && options.ecosystem && options.packageName
      ? `${options.ecosystem}:${options.packageName} (${options.name})`
      : `${options.consumerId} → ${options.providerId}`;
    renderer.success(`Dependency '${dependencyLabel}' added`, data);
  } catch (error) {
    renderer.error("Failed to add dependency", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
