/**
 * CLI Command: jumbo work resume
 *
 * Resumes the current worker's paused goal (transitions status from 'paused' to 'doing').
 * This is a parameterless command that automatically identifies the worker's paused goal.
 * Returns session orientation context with resume-specific LLM instructions.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { ResumeWorkCommandHandler, ResumeWorkResult } from "../../../../../application/work/resume/ResumeWorkCommandHandler.js";
import { SessionStartTextRenderer } from "../../sessions/start/SessionStartTextRenderer.js";
import { SessionContextView } from "../../../../../application/sessions/get-context/SessionContext.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Resume the current worker's paused goal",
  category: "work",
  requiredOptions: [],
  options: [],
  examples: [
    {
      command: "jumbo work resume",
      description: "Resume your paused goal and get context"
    }
  ],
  related: ["work pause", "goal resume", "goal start"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 *
 * Responsibilities (presentation layer only):
 * - Execute resume command (which also assembles session context)
 * - Render session context for display
 * - Map resume-specific instruction signals to LLM text
 */
export async function workResume(
  _options: Record<string, never>,
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    const config = renderer.getConfig();
    const isTextOutput = config.format === "text";

    if (isTextOutput) {
      renderer.info("Loading orientation context...\n");
    }

    // 1. COMMAND + QUERY: Resume work and get enriched session context
    const commandHandler = new ResumeWorkCommandHandler(
      container.workerIdentityReader,
      container.goalStatusReader,
      container.goalResumedEventStore,
      container.goalResumedEventStore,
      container.goalResumedProjector,
      container.eventBus,
      container.goalClaimPolicy,
      container.settingsReader,
      container.sessionSummaryProjectionStore,
      container.projectContextReader,
      container.audienceContextReader,
      container.audiencePainContextReader,
      container.unprimedBrownfieldQualifier
    );

    const result = await commandHandler.execute({});

    // 2. RENDER: Display session context
    if (isTextOutput) {
      const textRenderer = new SessionStartTextRenderer();
      const textOutput = textRenderer.render(result.sessionContext);

      for (const block of textOutput.blocks) {
        if (block) {
          renderer.info(block);
        }
      }

      renderer.info("---\n");
      renderer.info(renderResumeInstruction(result.sessionContext));
    }

    // 3. OUTPUT: Render success
    if (isTextOutput) {
      renderer.success("Work resumed", {
        goalId: result.goalId,
        objective: result.objective,
        status: "doing",
      });
    } else {
      renderer.data(buildStructuredResumeOutput(result));
    }
  } catch (error) {
    renderer.error("Failed to resume work", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}

/**
 * Maps resume instruction signals to LLM-facing text.
 * Presentation layer owns copy; application layer owns instruction signals.
 */
function renderResumeInstruction(sessionContext: SessionContextView): string {
  const lines: string[] = [];

  if (sessionContext.instructions.includes("resume-continuation-prompt")) {
    lines.push(
      "@LLM: Your work was previously interrupted. Continue working on the resumed goal.",
      "Determine where you left off based on the registered progress and resume from there.",
      "Register completed sub-tasks via 'jumbo goal update-progress --help'."
    );
  }

  if (sessionContext.instructions.includes("paused-goals-context")) {
    lines.push(
      "IMPORTANT: There are paused goals. Run 'jumbo goal resume --goal-id <id>' to resume a specific goal."
    );
  }

  return lines.join("\n") + "\n";
}

function buildStructuredResumeOutput(result: ResumeWorkResult) {
  const textRenderer = new SessionStartTextRenderer();
  const structuredContext = textRenderer.buildStructuredContext(result.sessionContext);

  return {
    ...structuredContext,
    llmInstructions: {
      ...structuredContext.llmInstructions,
      workResume: renderResumeInstruction(result.sessionContext).trim(),
    },
    workResume: {
      goalId: result.goalId,
      objective: result.objective,
      status: "doing",
    },
  };
}
