/**
 * CLI Command: jumbo decisions list
 *
 * Lists all architectural decisions (ADRs) with optional status filtering.
 *
 * Usage:
 *   jumbo decisions list
 *   jumbo decisions list --status active
 *   jumbo decisions list --status superseded --format json
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { DecisionStatusFilter } from "../../../../../application/context/decisions/get/IDecisionViewReader.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { RenderData } from "../../../rendering/types.js";
import { DecisionListOutputBuilder } from "./DecisionListOutputBuilder.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "List all architectural decisions (ADRs)",
  category: "solution",
  options: [
    {
      flags: "-s, --status <status>",
      description: "Filter by status: active, superseded, reversed, or all (default: all)",
    },
  ],
  examples: [
    {
      command: "jumbo decisions list",
      description: "List all decisions",
    },
    {
      command: "jumbo decisions list --status active",
      description: "List only active decisions",
    },
    {
      command: "jumbo decisions list --status superseded --format json",
      description: "List superseded decisions as JSON",
    },
  ],
  related: ["decision add", "decision update", "decision reverse", "decision supersede"],
};

/**
 * Validate status filter
 */
function isValidStatus(status: string): status is DecisionStatusFilter {
  return ["active", "superseded", "reversed", "all"].includes(status);
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function decisionsList(
  options: { status?: string },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    // Validate and normalize status filter
    const statusFilter = options.status || "all";
    if (!isValidStatus(statusFilter)) {
      renderer.error(`Invalid status: ${statusFilter}. Must be one of: active, superseded, reversed, all`);
      process.exit(1);
    }

    // Delegate to controller
    const { decisions } = await container.getDecisionsController.handle({ status: statusFilter });

    if (decisions.length === 0) {
      const filterMsg = statusFilter === "all" ? "" : ` with status '${statusFilter}'`;
      renderer.info(`No decisions found${filterMsg}. Use 'jumbo decision add' to add one.`);
      return;
    }

    // Check if we're in structured output mode by examining renderer config
    const config = renderer.getConfig();

    const outputBuilder = new DecisionListOutputBuilder();
    if (config.format === "text") {
      const output = outputBuilder.build(decisions, statusFilter);
      renderer.info(output.toHumanReadable());
    } else {
      const output = outputBuilder.buildStructuredOutput(decisions, statusFilter);
      const sections = output.getSections();
      const dataSection = sections.find(s => s.type === "data");
      if (dataSection) renderer.data(dataSection.content as RenderData);
    }
  } catch (error) {
    renderer.error("Failed to list decisions", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
