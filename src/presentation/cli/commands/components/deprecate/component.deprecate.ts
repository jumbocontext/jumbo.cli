/**
 * CLI Command: jumbo component deprecate
 *
 * Marks a component as deprecated when it's being phased out but not yet removed from the codebase.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Mark a component as deprecated",
  category: "solution",
  requiredOptions: [
    {
      flags: "-i, --id <id>",
      description: "ID of the component to deprecate"
    }
  ],
  options: [
    {
      flags: "-r, --reason <reason>",
      description: "Reason for deprecation (max 500 chars)"
    }
  ],
  examples: [
    {
      command: "jumbo component deprecate --id comp_123",
      description: "Deprecate a component without specifying a reason"
    },
    {
      command: "jumbo component deprecate --id comp_123 --reason 'Replaced by NewAuthMiddleware'",
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
    id: string;
    reason?: string;
  },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    const response = await container.deprecateComponentController.handle({
      componentId: options.id,
      reason: options.reason,
    });

    const data: Record<string, string | number> = {
      componentId: response.componentId,
      name: response.name,
      status: response.status
    };

    if (response.reason) data.reason = response.reason;

    renderer.success(`Component '${response.name}' marked as deprecated`, data);
  } catch (error) {
    renderer.error("Failed to deprecate component", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}
