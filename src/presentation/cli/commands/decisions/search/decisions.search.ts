/**
 * CLI Command: jumbo decisions search
 *
 * Searches decisions by status, title, and free-text query across decision fields.
 * Filters combine with AND logic.
 *
 * Usage:
 *   jumbo decisions search --title architecture
 *   jumbo decisions search --status active
 *   jumbo decisions search --query "stdout" --output compact
 *   jumbo decisions search --title Clean* --format json
 */

import { DecisionStatusFilter } from "../../../../../application/context/decisions/get/IDecisionViewReader.js";
import { DecisionSearchCriteria } from "../../../../../application/context/decisions/search/DecisionSearchCriteria.js";
import { SearchDecisionsRequest } from "../../../../../application/context/decisions/search/SearchDecisionsRequest.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { RenderData } from "../../../rendering/types.js";
import { DecisionSearchOutputBuilder, DecisionSearchOutputFormat } from "./DecisionSearchOutputBuilder.js";

const VALID_DECISION_STATUSES: readonly DecisionStatusFilter[] = ["active", "superseded", "reversed", "all"];

export const metadata: CommandMetadata = {
  description: "Search architectural decisions by status, title, or free-text query",
  category: "solution",
  options: [
    {
      flags: "-t, --title <title>",
      description: "Filter by title (substring match, or use * for wildcards: Clean*, *Architecture)",
    },
    {
      flags: "-s, --status <status>",
      description: "Filter by status: active, superseded, reversed, or all (default: all)",
    },
    {
      flags: "-q, --query <query>",
      description: "Free-text search across title, context, rationale, alternatives, consequences, reversal reason, and superseded-by fields (supports * wildcards)",
    },
    {
      flags: "-o, --output <output>",
      description: "Output detail level: default or compact (id, title, status only)",
    },
  ],
  examples: [
    {
      command: "jumbo decisions search --title architecture",
      description: "Search decisions by title",
    },
    {
      command: "jumbo decisions search --status active",
      description: "Search active decisions",
    },
    {
      command: "jumbo decisions search --query \"event handling\" --output compact",
      description: "Free-text search with compact output",
    },
  ],
  related: ["decisions list", "decision add", "decision update", "decision reverse", "decision supersede"],
  requiresProject: true
};

export async function decisionsSearch(
  options: { title?: string; status?: string; query?: string; output?: string },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    const statusFilter = options.status || "all";
    if (!VALID_DECISION_STATUSES.includes(statusFilter as DecisionStatusFilter)) {
      renderer.error(`Invalid status: ${statusFilter}. Must be one of: active, superseded, reversed, all`);
      process.exit(1);
    }

    const outputFormat: DecisionSearchOutputFormat = options.output === "compact" ? "compact" : "default";
    if (options.output && options.output !== "default" && options.output !== "compact") {
      renderer.error(`Invalid output format: ${options.output}. Must be one of: default, compact`);
      process.exit(1);
    }

    const criteria: DecisionSearchCriteria = {
      status: statusFilter as DecisionStatusFilter,
      ...(options.title && { title: options.title }),
      ...(options.query && { query: options.query }),
    };

    const request: SearchDecisionsRequest = { criteria };
    const { decisions } = await container.searchDecisionsController.handle(request);

    const outputBuilder = new DecisionSearchOutputBuilder();
    const config = renderer.getConfig();

    if (config.format === "text") {
      const output = outputBuilder.build(decisions, outputFormat);
      renderer.info(output.toHumanReadable());
    } else {
      const output = outputBuilder.buildStructuredOutput(decisions, outputFormat);
      const sections = output.getSections();
      const dataSection = sections.find(s => s.type === "data");
      if (dataSection) renderer.data(dataSection.content as RenderData);
    }
  } catch (error) {
    renderer.error("Failed to search decisions", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}
