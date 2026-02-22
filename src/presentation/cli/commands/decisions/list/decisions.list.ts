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
import { DecisionView } from "../../../../../application/context/decisions/DecisionView.js";

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
 * Format status for display
 */
function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    active: "[ACTIVE]",
    superseded: "[SUPERSEDED]",
    reversed: "[REVERSED]",
  };
  return statusMap[status] || `[${status.toUpperCase()}]`;
}

/**
 * Format decision for text output
 */
function formatDecisionText(decision: DecisionView): void {
  console.log(`${formatStatus(decision.status)} ${decision.title}`);
  console.log(`  Context: ${decision.context.substring(0, 100)}${decision.context.length > 100 ? "..." : ""}`);
  if (decision.rationale) {
    console.log(`  Rationale: ${decision.rationale.substring(0, 100)}${decision.rationale.length > 100 ? "..." : ""}`);
  }
  if (decision.supersededBy) {
    console.log(`  Superseded by: ${decision.supersededBy}`);
  }
  if (decision.reversalReason) {
    console.log(`  Reversal: ${decision.reversalReason}`);
  }
  console.log(`  ID: ${decision.decisionId}`);
  console.log("");
}

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

    if (config.format === "text") {
      // Text format: human-readable output
      const filterLabel = statusFilter === "all" ? "" : ` (${statusFilter})`;
      console.log(`\nArchitectural Decisions${filterLabel} (${decisions.length}):\n`);
      for (const decision of decisions) {
        formatDecisionText(decision);
      }
    } else {
      // Structured format (json/yaml/ndjson): use renderer.data()
      const data = {
        count: decisions.length,
        filter: statusFilter,
        decisions: decisions.map((d) => ({
          decisionId: d.decisionId,
          title: d.title,
          context: d.context,
          rationale: d.rationale,
          alternatives: d.alternatives,
          consequences: d.consequences,
          status: d.status,
          supersededBy: d.supersededBy,
          reversalReason: d.reversalReason,
          reversedAt: d.reversedAt,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
        })),
      };
      renderer.data(data);
    }
  } catch (error) {
    renderer.error("Failed to list decisions", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
