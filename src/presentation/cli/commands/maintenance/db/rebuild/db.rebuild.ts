/**
 * CLI Command: jumbo db rebuild
 *
 * Rebuilds the materialized views (SQLite database) by replaying all events
 * from the event store. Useful for recovering from database corruption.
 *
 * This command delegates to the application layer for the rebuild operation.
 * All infrastructure concerns (closing connections, deleting files) are
 * handled by the infrastructure layer via dependency inversion.
 */

import fs from "fs-extra";
import path from "path";
import { CommandMetadata } from "../../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Rebuild the database from the event store",
  options: [
    {
      flags: "--yes",
      description: "Skip confirmation prompt",
    },
  ],
  examples: [
    {
      command: "jumbo db rebuild",
      description: "Rebuild the database with confirmation prompt",
    },
    {
      command: "jumbo db rebuild --yes",
      description: "Rebuild the database without confirmation",
    },
  ],
  related: [],
};

interface RebuildOptions {
  yes?: boolean;
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function dbRebuild(options: RebuildOptions, container: IApplicationContainer) {
  const renderer = Renderer.getInstance();

  try {
    // Get jumbo root directory
    const jumboRoot = path.join(process.cwd(), ".jumbo");

    // Check if Jumbo is initialized
    if (!(await fs.pathExists(jumboRoot))) {
      renderer.error("Not in a Jumbo project", "Run 'jumbo project init' first");
      process.exit(1);
    }

    // Confirm destructive operation
    if (!options.yes) {
      renderer.info(
        "⚠️  WARNING: This will delete and rebuild the database.\n" +
        "All materialized views will be reconstructed from the event store.\n"
      );
      renderer.error("Confirmation required", "Use --yes flag to proceed");
      process.exit(1);
    }

    renderer.info("Starting database rebuild...\n");

    // Delegate to infrastructure via application layer abstraction
    // All db lifecycle concerns (close, delete, reinitialize) are handled internally
    const result = await container.databaseRebuildService.rebuild();

    // Success output
    renderer.success("Database rebuilt successfully", {
      eventsReplayed: result.eventsReplayed,
    });
  } catch (error) {
    renderer.error(
      "Failed to rebuild database",
      error instanceof Error ? error : String(error)
    );
    process.exit(1);
  }
}
