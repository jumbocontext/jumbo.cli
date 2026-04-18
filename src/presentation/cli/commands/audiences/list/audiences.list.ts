/**
 * CLI Command: jumbo audiences list
 *
 * Lists all active (non-removed) target audiences for the project.
 *
 * Usage:
 *   jumbo audiences list
 *   jumbo audiences list --format json
 *   jumbo audiences list --format yaml
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { RenderData } from "../../../rendering/types.js";
import { AudienceListOutputBuilder } from './AudienceListOutputBuilder.js';

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "List all target audiences for the project",
  category: "project-knowledge",
  examples: [
    {
      command: "jumbo audiences list",
      description: "List all audiences in text format",
    },
    {
      command: "jumbo audiences list --format json",
      description: "List all audiences as JSON",
    },
    {
      command: "jumbo audiences list --format yaml",
      description: "List all audiences as YAML",
    },
  ],
  related: ["audience add", "audience update", "audience remove"],
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function audiencesList(
  _options: Record<string, never>,
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    const { audiences } = await container.listAudiencesController.handle({});

    if (audiences.length === 0) {
      renderer.info("No audiences defined yet. Use 'jumbo audience add' to add one.");
      return;
    }

    // Check if we're in structured output mode by examining renderer config
    const config = renderer.getConfig();
    const outputBuilder = new AudienceListOutputBuilder();

    if (config.format === "text") {
      const output = outputBuilder.build(audiences);
      renderer.info(output.toHumanReadable());
    } else {
      const output = outputBuilder.buildStructuredOutput(audiences);
      const sections = output.getSections();
      const dataSection = sections.find(s => s.type === "data");
      if (dataSection) renderer.data(dataSection.content as RenderData);
    }
  } catch (error) {
    renderer.error("Failed to list audiences", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
