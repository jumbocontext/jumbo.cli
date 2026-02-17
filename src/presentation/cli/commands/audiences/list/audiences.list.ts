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
import { AudienceView } from "../../../../../application/context/audiences/AudienceView.js";

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
 * Format priority for display
 */
function formatPriority(priority: string): string {
  return priority.toUpperCase();
}

/**
 * Format audience for text output
 */
function formatAudienceText(audience: AudienceView): void {
  console.log(`[${formatPriority(audience.priority)}] ${audience.name}`);
  console.log(`  ${audience.description}`);
  console.log(`  ID: ${audience.audienceId}`);
  console.log("");
}

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

    if (config.format === "text") {
      // Text format: human-readable output
      console.log(`\nTarget Audiences (${audiences.length}):\n`);
      for (const audience of audiences) {
        formatAudienceText(audience);
      }
    } else {
      // Structured format (json/yaml/ndjson): use renderer.data()
      const data = {
        count: audiences.length,
        audiences: audiences.map((a) => ({
          audienceId: a.audienceId,
          name: a.name,
          description: a.description,
          priority: a.priority,
          createdAt: a.createdAt,
          updatedAt: a.updatedAt,
        })),
      };
      renderer.data(data);
    }
  } catch (error) {
    renderer.error("Failed to list audiences", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
