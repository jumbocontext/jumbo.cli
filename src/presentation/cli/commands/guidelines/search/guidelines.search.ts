/**
 * CLI Command: jumbo guidelines search
 *
 * Searches guidelines by category, title, and free-text query across title,
 * description, rationale, and examples fields. Filters combine with AND logic.
 *
 * Usage:
 *   jumbo guidelines search --category testing
 *   jumbo guidelines search --title "Output*"
 *   jumbo guidelines search --query "stdout" --output compact
 */

import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { GuidelineSearchCriteria } from "../../../../../application/context/guidelines/search/GuidelineSearchCriteria.js";
import { SearchGuidelinesRequest } from "../../../../../application/context/guidelines/search/SearchGuidelinesRequest.js";
import { GuidelineCategoryValue, GuidelineCategory } from "../../../../../domain/guidelines/Constants.js";
import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { RenderData } from "../../../rendering/types.js";
import { GuidelineSearchOutputBuilder, GuidelineSearchOutputFormat } from "./GuidelineSearchOutputBuilder.js";

const VALID_GUIDELINE_CATEGORIES = Object.values(GuidelineCategory);

export const metadata: CommandMetadata = {
  description: "Search guidelines by category, title, or free-text query",
  category: "solution",
  options: [
    {
      flags: "-c, --category <category>",
      description: "Filter by category (exact match): testing, codingStyle, process, communication, documentation, security, performance, other",
    },
    {
      flags: "-t, --title <title>",
      description: "Filter by title (substring match, or use * for wildcards: Output*, *Style)",
    },
    {
      flags: "-q, --query <query>",
      description: "Free-text search across title, description, rationale, and examples fields (supports * wildcards)",
    },
    {
      flags: "-o, --output <output>",
      description: "Output detail level: default or compact (id, category, title only)",
    },
  ],
  examples: [
    {
      command: "jumbo guidelines search --category testing",
      description: "Search guidelines by category",
    },
    {
      command: "jumbo guidelines search --title \"Output*\"",
      description: "Search guidelines by title",
    },
    {
      command: "jumbo guidelines search --query \"stdout\" --output compact",
      description: "Free-text search with compact output",
    },
  ],
  related: ["guidelines list", "guideline add", "guideline update", "guideline remove"],
  requiresProject: true
};

export async function guidelinesSearch(
  options: { category?: string; title?: string; query?: string; output?: string },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    if (options.category && !VALID_GUIDELINE_CATEGORIES.includes(options.category as GuidelineCategoryValue)) {
      renderer.error(`Invalid category: ${options.category}. Must be one of: ${VALID_GUIDELINE_CATEGORIES.join(", ")}`);
      process.exit(1);
    }

    const outputFormat: GuidelineSearchOutputFormat = options.output === "compact" ? "compact" : "default";
    if (options.output && options.output !== "default" && options.output !== "compact") {
      renderer.error(`Invalid output format: ${options.output}. Must be one of: default, compact`);
      process.exit(1);
    }

    const criteria: GuidelineSearchCriteria = {
      ...(options.category && { category: options.category as GuidelineCategoryValue }),
      ...(options.title && { title: options.title }),
      ...(options.query && { query: options.query }),
    };

    const request: SearchGuidelinesRequest = { criteria };
    const { guidelines } = await container.searchGuidelinesController.handle(request);

    const outputBuilder = new GuidelineSearchOutputBuilder();
    const config = renderer.getConfig();

    if (config.format === "text") {
      const output = outputBuilder.build(guidelines, outputFormat);
      renderer.info(output.toHumanReadable());
    } else {
      const output = outputBuilder.buildStructuredOutput(guidelines, outputFormat);
      const sections = output.getSections();
      const dataSection = sections.find(s => s.type === "data");
      if (dataSection) renderer.data(dataSection.content as RenderData);
    }
  } catch (error) {
    renderer.error("Failed to search guidelines", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}
