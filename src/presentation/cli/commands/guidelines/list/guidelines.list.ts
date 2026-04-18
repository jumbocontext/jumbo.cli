/**
 * CLI Command: jumbo guidelines list
 *
 * Lists all execution guidelines with optional category filtering.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { RenderData } from "../../../rendering/types.js";
import { GuidelineListOutputBuilder } from "./GuidelineListOutputBuilder.js";

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

    const outputBuilder = new GuidelineListOutputBuilder();
    if (config.format === "text") {
      const output = outputBuilder.build(guidelines, options.category);
      renderer.info(output.toHumanReadable());
    } else {
      const output = outputBuilder.buildStructuredOutput(guidelines, options.category);
      const sections = output.getSections();
      const dataSection = sections.find(s => s.type === "data");
      if (dataSection) renderer.data(dataSection.content as RenderData);
    }
  } catch (error) {
    renderer.error("Failed to list guidelines", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}
