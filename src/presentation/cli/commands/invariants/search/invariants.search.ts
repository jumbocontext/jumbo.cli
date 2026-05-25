/**
 * CLI Command: jumbo invariants search
 *
 * Searches invariants by title and free-text query across title,
 * description, and rationale fields. Filters combine with AND logic.
 *
 * Usage:
 *   jumbo invariants search --title architecture
 *   jumbo invariants search --query "stdout" --output compact
 *   jumbo invariants search --title Clean* --format json
 */

import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { LocalSearchInvariantsGateway } from "../../../../../application/context/invariants/search/LocalSearchInvariantsGateway.js";
import { InvariantSearchCriteria } from "../../../../../application/context/invariants/search/InvariantSearchCriteria.js";
import { SearchInvariantsController } from "../../../../../application/context/invariants/search/SearchInvariantsController.js";
import { SearchInvariantsRequest } from "../../../../../application/context/invariants/search/SearchInvariantsRequest.js";
import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { RenderData } from "../../../rendering/types.js";
import { InvariantSearchOutputBuilder, InvariantSearchOutputFormat } from "./InvariantSearchOutputBuilder.js";

export const metadata: CommandMetadata = {
  description: "Search invariants by title or free-text query",
  category: "solution",
  options: [
    {
      flags: "-t, --title <title>",
      description: "Filter by title (substring match, or use * for wildcards: Clean*, *Architecture)",
    },
    {
      flags: "-q, --query <query>",
      description: "Free-text search across title, description, and rationale fields (supports * wildcards)",
    },
    {
      flags: "-o, --output <output>",
      description: "Output detail level: default or compact (id and title only)",
    },
  ],
  examples: [
    {
      command: "jumbo invariants search --title architecture",
      description: "Search invariants by title",
    },
    {
      command: "jumbo invariants search --query \"stdout\" --output compact",
      description: "Free-text search with compact output",
    },
  ],
  related: ["invariants list", "invariant add", "invariant update", "invariant remove"],
  requiresProject: true
};

export async function invariantsSearch(
  options: { title?: string; query?: string; output?: string },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    const outputFormat: InvariantSearchOutputFormat = options.output === "compact" ? "compact" : "default";
    if (options.output && options.output !== "default" && options.output !== "compact") {
      renderer.error(`Invalid output format: ${options.output}. Must be one of: default, compact`);
      process.exit(1);
    }

    const criteria: InvariantSearchCriteria = {
      ...(options.title && { title: options.title }),
      ...(options.query && { query: options.query }),
    };

    const request: SearchInvariantsRequest = { criteria };
    const controller = new SearchInvariantsController(
      new LocalSearchInvariantsGateway(container.invariantViewReader)
    );
    const { invariants } = await controller.handle(request);

    const outputBuilder = new InvariantSearchOutputBuilder();
    const config = renderer.getConfig();

    if (config.format === "text") {
      const output = outputBuilder.build(invariants, outputFormat);
      renderer.info(output.toHumanReadable());
    } else {
      const output = outputBuilder.buildStructuredOutput(invariants, outputFormat);
      const sections = output.getSections();
      const dataSection = sections.find(s => s.type === "data");
      if (dataSection) renderer.data(dataSection.content as RenderData);
    }
  } catch (error) {
    renderer.error("Failed to search invariants", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}
