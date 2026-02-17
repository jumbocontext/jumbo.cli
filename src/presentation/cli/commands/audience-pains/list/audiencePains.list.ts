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
import { AudiencePainView } from "../../../../../application/context/audience-pains/AudiencePainView.js";

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
 * Format status for display
 */
function formatStatus(status: string): string {
  return status.toUpperCase();
}

/**
 * Format pain point for text output
 */
function formatPainText(pain: AudiencePainView): void {
  console.log(`[${formatStatus(pain.status)}] ${pain.title}`);
  console.log(`  ${pain.description}`);
  console.log(`  ID: ${pain.painId}`);
  console.log("");
}

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

    if (config.format === "text") {
      // Text format: human-readable output
      console.log(`\nAudience Pain Points (${pains.length}):\n`);
      for (const pain of pains) {
        formatPainText(pain);
      }
    } else {
      // Structured format (json/yaml/ndjson): use renderer.data()
      const data = {
        count: pains.length,
        pains: pains.map((p) => ({
          painId: p.painId,
          title: p.title,
          description: p.description,
          status: p.status,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        })),
      };
      renderer.data(data);
    }
  } catch (error) {
    renderer.error("Failed to list audience pains", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
