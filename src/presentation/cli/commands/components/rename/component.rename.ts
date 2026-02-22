/**
 * CLI Command: jumbo component rename
 *
 * Renames an existing component while preserving its identity and relations.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Rename an existing component",
  category: "solution",
  requiredOptions: [
    {
      flags: "-i, --id <id>",
      description: "ID of the component to rename"
    },
    {
      flags: "-n, --name <name>",
      description: "New name for the component"
    }
  ],
  options: [],
  examples: [
    {
      command: 'jumbo component rename --id comp_123 --name "NewComponentName"',
      description: "Rename a component"
    }
  ],
  related: ["component add", "component update", "component deprecate", "component remove"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function componentRename(
  options: {
    id: string;
    name: string;
  },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    const response = await container.renameComponentController.handle({
      componentId: options.id,
      name: options.name,
    });

    renderer.success(`Component renamed to '${options.name}'`, {
      componentId: response.componentId,
      name: options.name,
    });
  } catch (error) {
    renderer.error("Failed to rename component", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}
