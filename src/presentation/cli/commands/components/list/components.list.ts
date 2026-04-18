/**
 * CLI Command: jumbo components list
 *
 * Lists all software components with optional status filtering.
 *
 * Usage:
 *   jumbo components list
 *   jumbo components list --status active
 *   jumbo components list --status deprecated --format json
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { ComponentStatusFilter } from "../../../../../application/context/components/get/IComponentViewReader.js";
import { GetComponentsRequest } from "../../../../../application/context/components/list/GetComponentsRequest.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { RenderData } from "../../../rendering/types.js";
import { ComponentListOutputBuilder } from "./ComponentListOutputBuilder.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "List all software components",
  category: "solution",
  options: [
    {
      flags: "-s, --status <status>",
      description: "Filter by status: active, deprecated, removed, or all (default: all)",
    },
  ],
  examples: [
    {
      command: "jumbo components list",
      description: "List all components",
    },
    {
      command: "jumbo components list --status active",
      description: "List only active components",
    },
    {
      command: "jumbo components list --status deprecated --format json",
      description: "List deprecated components as JSON",
    },
  ],
  related: ["component add", "component update", "component deprecate", "component remove"],
};

/**
 * Validate status filter
 */
function isValidStatus(status: string): status is ComponentStatusFilter {
  return ["active", "deprecated", "removed", "all"].includes(status);
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function componentsList(
  options: { status?: string },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    // Validate and normalize status filter
    const statusFilter = options.status || "all";
    if (!isValidStatus(statusFilter)) {
      renderer.error(`Invalid status: ${statusFilter}. Must be one of: active, deprecated, removed, all`);
      process.exit(1);
    }

    // Execute query via controller
    const request: GetComponentsRequest = { status: statusFilter };
    const { components } = await container.getComponentsController.handle(request);

    if (components.length === 0) {
      const filterMsg = statusFilter === "all" ? "" : ` with status '${statusFilter}'`;
      renderer.info(`No components found${filterMsg}. Use 'jumbo component add' to add one.`);
      return;
    }

    // Check if we're in structured output mode by examining renderer config
    const config = renderer.getConfig();

    const outputBuilder = new ComponentListOutputBuilder();
    if (config.format === "text") {
      const output = outputBuilder.build(components, statusFilter);
      renderer.info(output.toHumanReadable());
    } else {
      const output = outputBuilder.buildStructuredOutput(components, statusFilter);
      const sections = output.getSections();
      const dataSection = sections.find(s => s.type === "data");
      if (dataSection) renderer.data(dataSection.content as RenderData);
    }
  } catch (error) {
    renderer.error("Failed to list components", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
