/**
 * CLI Command: jumbo worker view
 *
 * Displays the current worker's profile including identity and claim settings.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { Colors } from "../../../rendering/StyleConfig.js";
import { heading, metaField } from "../../../rendering/OutputLayout.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Display current worker profile",
  category: "host",
  examples: [
    {
      command: "jumbo worker view",
      description: "Show current worker identity and claim settings"
    }
  ],
  related: ["goal start", "goal show"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function workerView(
  options: Record<string, never>,
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    const { workerId, claimDurationMinutes } = await container.viewWorkerController.handle({});

    // For TTY (human): display formatted text
    // For pipe/file (machine): output structured JSON
    if (process.stdout.isTTY) {
      const lines: string[] = [];
      lines.push("");
      lines.push(heading("Worker Profile"));
      lines.push("");
      lines.push(metaField("Worker ID", Colors.primary(workerId), 16));
      lines.push(metaField("Claim Duration", Colors.primary(`${claimDurationMinutes} minutes`), 16));
      lines.push("");
      renderer.info(lines.join("\n"));
    } else {
      // Structured output for programmatic consumers
      renderer.data({
        workerId,
        claimDurationMinutes
      });
    }
  } catch (error) {
    renderer.error("Failed to view worker profile", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}
