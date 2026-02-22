/**
 * CLI Command: jumbo component add
 *
 * Adds a new component to the system or updates existing component if name already exists.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { ComponentTypeValue } from "../../../../../domain/components/Constants.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Add a component to track software components in the system",
  category: "solution",
  requiredOptions: [
    {
      flags: "-n, --name <name>",
      description: "Component name"
    },
    {
      flags: "-T, --type <type>",
      description: "Component type (service, db, queue, ui, lib, api, worker, cache, storage)"
    },
    {
      flags: "-d, --description <description>",
      description: "What the component does"
    },
    {
      flags: "--responsibility <responsibility>",
      description: "Single responsibility of the component"
    },
    {
      flags: "--path <path>",
      description: "File path to the component"
    }
  ],
  examples: [
    {
      command: 'jumbo component add --name "UserController" --type "service" --description "Handles user-related HTTP requests" --responsibility "User authentication and profile management" --path "src/api/user-controller.ts"',
      description: "Add a service component"
    },
    {
      command: 'jumbo component add --name "PostgresDB" --type "db" --description "Primary database" --responsibility "Data persistence" --path "docker-compose.yml"',
      description: "Add a database component"
    }
  ],
  related: ["component update", "component deprecate", "component remove"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function componentAdd(
  options: {
    name: string;
    type: ComponentTypeValue;
    description: string;
    responsibility: string;
    path: string;
  },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    const response = await container.addComponentController.handle({
      name: options.name,
      type: options.type,
      description: options.description,
      responsibility: options.responsibility,
      path: options.path,
    });

    const data: Record<string, string> = {
      componentId: response.componentId,
      name: response.name,
      type: response.type,
      path: response.path,
      status: response.status,
    };

    if (response.isUpdate) {
      renderer.success(`Component '${response.name}' updated`, data);
    } else {
      renderer.success(`Component '${response.name}' added`, data);
    }
  } catch (error) {
    renderer.error("Failed to add component", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}
