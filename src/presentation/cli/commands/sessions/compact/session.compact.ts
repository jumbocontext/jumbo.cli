/**
 * CLI Command: jumbo session compact
 *
 * Signals the agent to perform context compaction.
 * Triggers pause.forCompaction of the context workers claimed goal
 */

import { exec } from "child_process";
import { promisify } from "util";
import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";

const execAsync = promisify(exec);

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Trigger context compaction",
  category: "work",
  options: [],
  examples: [
    {
      command: "jumbo session compact",
      description: "Trigger context compaction",
    },
  ],
  related: ["session start", "session end"],
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function sessionCompact(
  options: Record<string, never>,
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    renderer.info("Triggering /compact...\n");

    const { stdout, stderr } = await execAsync("/compact");

    if (stdout) {
      renderer.info(stdout);
    }
    if (stderr) {
      renderer.info(stderr);
    }

    renderer.success("Compact triggered", {});
  } catch (error) {
    renderer.error(
      "Failed to run /compact",
      error instanceof Error ? error : String(error)
    );
    process.exit(1);
  }
}
