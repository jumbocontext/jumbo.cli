/**
 * CLI Command: jumbo audiencePains list
 *
 * Lists all active (non-resolved) audience pain points for the project.
 *
 * Usage:
 *   jumbo audiencePains list
 *   jumbo audiencePains list --format json
 *   jumbo audiencePains list --format yaml
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { RenderData } from "../../../rendering/types.js";
import { AudiencePainListOutputBuilder } from './AudiencePainListOutputBuilder.js';

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "List all active audience pain points",
  category: "project-knowledge",
  examples: [
    {
      command: "jumbo audiencePains list",
      description: "List all active pain points in text format",
    },
    {
      command: "jumbo audiencePains list --format json",
      description: "List all pain points as JSON",
    },
    {
      command: "jumbo audiencePains list --format yaml",
      description: "List all pain points as YAML",
    },
  ],
  related: ["audiencePain add", "audiencePain update"],
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function audiencePainsList(
  _options: Record<string, never>,
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    const { pains } = await container.getAudiencePainsController.handle({});

    if (pains.length === 0) {
      renderer.info("No active pain points. Use 'jumbo audiencePain add' to add one.");
      return;
    }

    // Check if we're in structured output mode by examining renderer config
    const config = renderer.getConfig();
    const outputBuilder = new AudiencePainListOutputBuilder();

    if (config.format === "text") {
      const output = outputBuilder.build(pains);
      renderer.info(output.toHumanReadable());
    } else {
      const output = outputBuilder.buildStructuredOutput(pains);
      const sections = output.getSections();
      const dataSection = sections.find(s => s.type === "data");
      if (dataSection) renderer.data(dataSection.content as RenderData);
    }
  } catch (error) {
    renderer.error("Failed to list audience pains", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
