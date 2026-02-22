/**
 * CLI Command: jumbo guidelines list
 *
 * Lists all execution guidelines with optional category filtering.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { GuidelineView } from "../../../../../application/context/guidelines/GuidelineView.js";

export const metadata: CommandMetadata = {
  description: "List all execution guidelines",
  category: "solution",
  options: [
    {
      flags: "-c, --category <category>",
      description: "Filter by category (e.g., codingStyle, testing, process)",
    },
  ],
  examples: [
    { command: "jumbo guidelines list", description: "List all guidelines" },
    { command: "jumbo guidelines list --category testing", description: "List testing guidelines" },
    { command: "jumbo guidelines list --format json", description: "List guidelines as JSON" },
  ],
  related: ["guideline add", "guideline update", "guideline remove"],
};

function formatGuidelineText(guideline: GuidelineView): void {
  console.log(`[${guideline.category.toUpperCase()}] ${guideline.title}`);
  console.log(`  ${guideline.description}`);
  console.log(`  ID: ${guideline.guidelineId}`);
  console.log("");
}

export async function guidelinesList(
  options: { category?: string },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    const { guidelines } = await container.getGuidelinesController.handle({
      category: options.category,
    });

    if (guidelines.length === 0) {
      const filterMsg = options.category ? ` in category '${options.category}'` : "";
      renderer.info(`No guidelines found${filterMsg}. Use 'jumbo guideline add' to add one.`);
      return;
    }

    const config = renderer.getConfig();

    if (config.format === "text") {
      const filterLabel = options.category ? ` (${options.category})` : "";
      console.log(`\nGuidelines${filterLabel} (${guidelines.length}):\n`);
      for (const guideline of guidelines) {
        formatGuidelineText(guideline);
      }
    } else {
      const data = {
        count: guidelines.length,
        filter: options.category ?? null,
        guidelines: guidelines.map((g) => ({
          guidelineId: g.guidelineId,
          category: g.category,
          title: g.title,
          description: g.description,
          rationale: g.rationale,
          enforcement: g.enforcement,
          examples: g.examples,
          createdAt: g.createdAt,
          updatedAt: g.updatedAt,
        })),
      };
      renderer.data(data);
    }
  } catch (error) {
    renderer.error("Failed to list guidelines", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}
