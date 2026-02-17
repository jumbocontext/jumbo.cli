/**
 * CLI Command: jumbo session start
 *
 * Starts a new working session to track developer activity and provide context.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { SessionStartTextRenderer } from "./SessionStartTextRenderer.js";
import { EnrichedSessionContext } from "../../../../../application/context/sessions/get/EnrichedSessionContext.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Start a new working session",
  category: "work",
  options: [],
  examples: [
    {
      command: 'jumbo session start',
      description: "Start a new working session",
    },
  ],
  related: ["session end", "session pause", "goal start"],
};

/**
 * Command handler
 * Called by Commander with parsed options
 *
 * Responsibilities (presentation layer only):
 * - Call SessionStartController for orchestrated session start
 * - Render the result for display
 *
 * Orchestration is delegated to SessionStartController in the application layer.
 */
export async function sessionStart(
  options: Record<string, never>,
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    const config = renderer.getConfig();
    const isTextOutput = config.format === "text";

    if (isTextOutput) {
      renderer.info("Loading orientation context...\n");
    }

    // 1. CONTROLLER: Orchestrate session start
    const response = await container.sessionStartController.handle({});

    // 2. RENDER: Display context and result
    if (isTextOutput) {
      const textRenderer = new SessionStartTextRenderer();
      const textOutput = textRenderer.render(response.context);

      for (const block of textOutput.blocks) {
        if (block) {
          renderer.info(block);
        }
      }

      renderer.info("---\n");
      renderer.info(textOutput.llmInstruction);

      renderer.success("Session started", {
        sessionId: response.sessionId,
      });
    } else {
      renderer.data(buildStructuredSessionStartOutput(response.context, response.sessionId));
    }
  } catch (error) {
    renderer.error("Failed to start session", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}

function buildStructuredSessionStartOutput(
  sessionContext: EnrichedSessionContext,
  sessionId: string
) {
  const textRenderer = new SessionStartTextRenderer();
  const structuredContext = textRenderer.buildStructuredContext(sessionContext);

  return {
    ...structuredContext,
    sessionStart: {
      sessionId,
    },
  };
}
