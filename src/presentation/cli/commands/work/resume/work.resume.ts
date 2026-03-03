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
import { ResumeWorkResponse } from "../../../../../application/context/work/resume/ResumeWorkResponse.js";
import { SessionStartTextRenderer } from "../../sessions/start/SessionStartTextRenderer.js";
import { EnrichedSessionContext } from "../../../../../application/context/sessions/get/EnrichedSessionContext.js";
import { GoalStartOutputBuilder } from "../../goals/start/GoalStartOutputBuilder.js";

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
 * - Execute resume controller (which orchestrates goal resume + session context)
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

    // 1. CONTROLLER: Resume work and get enriched session context
    const result = await container.resumeWorkController.handle({});

    // 2. RENDER: Display session context
    if (isTextOutput) {
      const textRenderer = new SessionStartTextRenderer();
      const textOutput = textRenderer.render(result.context);
      const goalStartOutputBuilder = new GoalStartOutputBuilder();
      const goalInstructions = goalStartOutputBuilder
        .build(result.goalContextView)
        .toHumanReadable();

      for (const block of textOutput.blocks) {
        if (block) {
          renderer.info(block);
        }
      }

      renderer.info("---\n");
      renderer.info(renderResumeInstruction(result.context));
      renderer.info(goalInstructions);
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
    // Check if this is a "no paused goal" scenario (not an error for hooks)
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isNoPausedGoal = errorMessage.includes("No paused goal found");

    if (isNoPausedGoal) {
      // Not an error - just no paused work. Exit cleanly for hooks.
      renderer.info("No paused goal to resume");
    } else {
      // Actual error - render error and fail
      renderer.error("Failed to resume work", error instanceof Error ? error : String(error));
      process.exit(1);
    }
  }
}

/**
 * Maps resume instruction signals to LLM-facing text.
 * Presentation layer owns copy; application layer owns instruction signals.
 */
function renderResumeInstruction(sessionContext: EnrichedSessionContext): string {
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
      "IMPORTANT: There are paused goals. Run 'jumbo goal resume --id <id>' to resume a specific goal."
    );
  }

  return lines.join("\n") + "\n";
}

function buildStructuredResumeOutput(result: ResumeWorkResponse) {
  const textRenderer = new SessionStartTextRenderer();
  const structuredContext = textRenderer.buildStructuredContext(result.context);

  return {
    ...structuredContext,
    llmInstructions: {
      ...structuredContext.llmInstructions,
      workResume: renderResumeInstruction(result.context).trim(),
    },
    workResume: {
      goalId: result.goalId,
      objective: result.objective,
      status: "doing",
    },
    resumedGoalContext: result.goalContextView,
  };
}
