/**
 * CLI Command: jumbo values list
 *
 * Lists all value propositions for the project.
 *
 * Usage:
 *   jumbo values list
 *   jumbo values list --format json
 *   jumbo values list --format yaml
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { RenderData } from "../../../rendering/types.js";
import { ValueListOutputBuilder } from './ValueListOutputBuilder.js';

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "List all value propositions for the project",
  category: "project-knowledge",
  examples: [
    {
      command: "jumbo values list",
      description: "List all value propositions in text format",
    },
    {
      command: "jumbo values list --format json",
      description: "List all value propositions as JSON",
    },
    {
      command: "jumbo values list --format yaml",
      description: "List all value propositions as YAML",
    },
  ],
  related: ["value add", "value update", "value remove"],
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function valuesList(
  _options: Record<string, never>,
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    const { values } = await container.getValuePropositionsController.handle({});

    if (values.length === 0) {
      renderer.info("No value propositions defined yet. Use 'jumbo value add' to add one.");
      return;
    }

    // Check if we're in structured output mode by examining renderer config
    const config = renderer.getConfig();
    const outputBuilder = new ValueListOutputBuilder();

    if (config.format === "text") {
      const output = outputBuilder.build(values);
      renderer.info(output.toHumanReadable());
    } else {
      const output = outputBuilder.buildStructuredOutput(values);
      const sections = output.getSections();
      const dataSection = sections.find(s => s.type === "data");
      if (dataSection) renderer.data(dataSection.content as RenderData);
    }
  } catch (error) {
    renderer.error("Failed to list value propositions", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
