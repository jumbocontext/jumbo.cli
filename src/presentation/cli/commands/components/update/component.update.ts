/**
 * CLI Command: jumbo component update
 *
 * Updates an existing component's metadata.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { ComponentTypeValue } from "../../../../../domain/components/Constants.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Update an existing component's metadata",
  category: "solution",
  requiredOptions: [
    {
      flags: "-i, --id <id>",
      description: "ID of the component to update"
    }
  ],
  options: [
    {
      flags: "-d, --description <text>",
      description: "Updated description"
    },
    {
      flags: "--responsibility <text>",
      description: "Updated responsibility"
    },
    {
      flags: "--path <path>",
      description: "Updated file path"
    },
    {
      flags: "-T, --type <type>",
      description: "Updated component type (api, service, db, queue, ui, lib, worker, cache, storage)"
    }
  ],
  examples: [
    {
      command: 'jumbo component update --id comp_123 --description "Updated: Handles all user operations"',
      description: "Update component description"
    },
    {
      command: 'jumbo component update --id comp_123 --description "New description" --responsibility "New responsibility" --type api',
      description: "Update multiple fields"
    }
  ],
  related: ["component add", "component deprecate", "component remove"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function componentUpdate(
  options: {
    id: string;
    description?: string;
    responsibility?: string;
    path?: string;
    type?: ComponentTypeValue;
  },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  // Validate at least one field provided
  if (!options.description && !options.responsibility && !options.path && !options.type) {
    renderer.error("At least one field must be provided to update (--description, --responsibility, --path, or --type)");
    process.exit(1);
  }

  try {
    const response = await container.updateComponentController.handle({
      componentId: options.id,
      description: options.description,
      responsibility: options.responsibility,
      path: options.path,
      type: options.type,
    });

    // Success output
    const data: Record<string, string | number> = {
      componentId: response.componentId,
      name: response.view?.name || options.id
    };

    if (options.description) data.description = options.description;
    if (options.responsibility) data.responsibility = options.responsibility;
    if (options.path) data.path = options.path;
    if (options.type) data.type = options.type;

    renderer.success(`Component '${response.view?.name || options.id}' updated`, data);
  } catch (error) {
    renderer.error("Failed to update component", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}
