/**
 * CLI Command: jumbo session end
 *
 * Ends the current active session with a focus summary.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "End the current active session",
  category: "work",
  requiredOptions: [
    {
      flags: "--focus <focus>",
      description: "Summary of what was accomplished",
    },
  ],
  options: [
    {
      flags: "--summary <text>",
      description: "Detailed session summary (optional)",
    },
  ],
  examples: [
    {
      command:
        'jumbo session end --focus "Completed authentication implementation"',
      description: "End session with focus summary",
    },
    {
      command:
        'jumbo session end --focus "Bug fixes" --summary "Fixed 3 critical bugs"',
      description: "End session with detailed summary",
    },
  ],
  related: ["session start", "session pause", "goal complete"],
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function sessionEnd(
  options: {
    focus: string;
    summary?: string;
  },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    const response = await container.endSessionController.handle({
      focus: options.focus,
      summary: options.summary,
    });

    const data: Record<string, string> = {
      sessionId: response.sessionId,
      focus: response.focus,
    };
    if (response.summary) {
      data.summary = response.summary;
    }

    renderer.success("Session ended", data);
  } catch (error) {
    renderer.error("Failed to end session", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
