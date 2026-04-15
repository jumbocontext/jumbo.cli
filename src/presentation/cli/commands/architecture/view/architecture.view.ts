/**
 * CLI Command: jumbo architecture view
 *
 * Displays the current architecture definition with deprecation notice.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import {
  ARCHITECTURE_DEPRECATION_NOTICE,
  ARCHITECTURE_MIGRATION_TABLE,
} from "../../../../../application/context/architecture/ArchitectureDeprecationConstants.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "View current project architecture (deprecated)",
  category: "solution",
  examples: [
    {
      command: "jumbo architecture view",
      description: "Show the current architecture definition"
    }
  ],
  related: ["decision add", "invariant add", "component add", "dependency add"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function architectureView(
  options: Record<string, never>,
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    const { architecture } = await container.getArchitectureController.handle({});

    if (!architecture) {
      renderer.info("No architecture defined.");
      return;
    }

    const config = renderer.getConfig();

    if (config.format === "text") {
      console.log("\n=== Architecture ===\n");
      console.log(`Architecture ID: ${architecture.architectureId}`);
      console.log(`Description:     ${architecture.description}`);
      console.log(`Organization:    ${architecture.organization}`);
      console.log(`Version:         ${architecture.version}`);
      console.log(`Created:         ${architecture.createdAt}`);
      console.log(`Updated:         ${architecture.updatedAt}`);

      if (architecture.patterns.length > 0) {
        console.log(`\nPatterns: ${architecture.patterns.join(", ")}`);
      }
      if (architecture.principles.length > 0) {
        console.log(`Principles: ${architecture.principles.join(", ")}`);
      }
      if (architecture.stack.length > 0) {
        console.log(`Stack: ${architecture.stack.join(", ")}`);
      }
      if (architecture.dataStores.length > 0) {
        console.log("\nData Stores:");
        for (const dataStore of architecture.dataStores) {
          console.log(`  - ${dataStore.name} (${dataStore.type}): ${dataStore.purpose}`);
        }
      }

      console.log(`\n--- ${ARCHITECTURE_DEPRECATION_NOTICE} ---`);
      console.log("Migrate to individual entities:");
      console.log(ARCHITECTURE_MIGRATION_TABLE);
      console.log("");
    } else {
      renderer.data({ architecture });
    }
  } catch (error) {
    renderer.error("Failed to view architecture", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}
