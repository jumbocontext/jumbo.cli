/**
 * CLI Command: jumbo session start
 *
 * Starts a new working session to track developer activity and provide context.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { StartSessionCommandHandler } from "../../../../../application/context/sessions/start/StartSessionCommandHandler.js";
import { StartSessionCommand } from "../../../../../application/context/sessions/start/StartSessionCommand.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { SessionStartContextQueryHandler } from "../../../../../application/context/sessions/get-context/SessionStartContextQueryHandler.js";
import { SessionStartTextRenderer } from "./SessionStartTextRenderer.js";
import { SessionStartContext } from "../../../../../application/context/sessions/get-context/SessionStartContext.js";

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
 * - Call SessionStartContextQueryHandler to get assembled context data
 * - Render the data for display
 * - Execute command and render result
 *
 * Data assembly is delegated to SessionStartContextQueryHandler in the application layer.
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

    // 1. QUERY: Get assembled context from application layer
    const getSessionStartContext = new SessionStartContextQueryHandler(
      container.sessionSummaryProjectionStore,
      container.goalStatusReader,
      container.projectContextReader,
      container.audienceContextReader,
      container.audiencePainContextReader,
      container.unprimedBrownfieldQualifier
    );
    const sessionContext = await getSessionStartContext.execute();

    // 2. RENDER: Display context
    if (isTextOutput) {
      const textRenderer = new SessionStartTextRenderer();
      const textOutput = textRenderer.render(sessionContext);

      for (const block of textOutput.blocks) {
        if (block) {
          renderer.info(block);
        }
      }

      renderer.info("---\n");
      renderer.info(textOutput.llmInstruction);
    }

    // 3. COMMAND: Execute session start
    const commandHandler = new StartSessionCommandHandler(
      container.sessionStartedEventStore,
      container.eventBus
    );

    const command: StartSessionCommand = {};
    const result = await commandHandler.execute(command);

    // 4. OUTPUT: Render success
    if (isTextOutput) {
      renderer.success("Session started", {
        sessionId: result.sessionId,
      });
    } else {
      renderer.data(buildStructuredSessionStartOutput(sessionContext, result.sessionId));
    }
  } catch (error) {
    renderer.error("Failed to start session", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}

function buildStructuredSessionStartOutput(
  sessionContext: SessionStartContext,
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
