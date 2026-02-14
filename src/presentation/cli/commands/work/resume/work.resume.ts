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
import { ResumeWorkResult } from "../../../../../application/context/work/resume/ResumeWorkCommandHandler.js";
import { SessionStartTextRenderer } from "../../sessions/start/SessionStartTextRenderer.js";
import { SessionContextView } from "../../../../../application/context/sessions/get-context/SessionContext.js";
import * as fs from "fs";
import * as path from "path";

/**
 * Synchronous debug logger - writes immediately to file, won't be lost on process termination
 */
function debugLog(message: string): void {
  const debugFile = path.join(process.cwd(), ".jumbo", "debug-resume.log");
  const timestamp = new Date().toISOString();
  try {
    fs.appendFileSync(debugFile, `[${timestamp}] ${message}\n`, "utf8");
  } catch (err) {
    // Write error to stderr so we can see it
    process.stderr.write(`[DEBUG-ERROR] Failed to write debug log: ${err}\n`);
    process.stderr.write(`[DEBUG-ERROR] Attempted path: ${debugFile}\n`);
    process.stderr.write(`[DEBUG-ERROR] cwd: ${process.cwd()}\n`);
  }
}

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
  debugLog("=== START workResume function ===");
  const renderer = Renderer.getInstance();
  debugLog("Got renderer instance");

  try {
    debugLog("Entered try block");
    container.logger.debug("[work.resume] Starting workResume command");
    debugLog("Called logger.debug (starting)");

    debugLog("About to call renderer.getConfig()");
    const config = renderer.getConfig();
    debugLog("Got renderer config, format=" + config.format);
    container.logger.debug("[work.resume] Got renderer config", { format: config.format });

    const isTextOutput = config.format === "text";
    debugLog("Determined output format, isTextOutput=" + isTextOutput);
    container.logger.debug("[work.resume] Determined output format", { isTextOutput });

    if (isTextOutput) {
      debugLog("About to render loading message");
      container.logger.debug("[work.resume] About to render loading message");
      debugLog("About to call renderer.info()");
      renderer.info("Loading orientation context...\n");
      debugLog("Rendered loading message successfully");
      container.logger.debug("[work.resume] Rendered loading message");
    }

    debugLog("About to execute ResumeWorkCommandHandler");
    container.logger.debug("[work.resume] About to execute ResumeWorkCommandHandler");

    // 1. COMMAND + QUERY: Resume work and get enriched session context
    const result = await container.resumeWorkCommandHandler.execute({});
    debugLog("Command handler execution completed");
    container.logger.debug("[work.resume] Command handler execution completed");

    container.logger.info("[work.resume] Successfully executed ResumeWorkCommandHandler");

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
    debugLog("CATCH BLOCK: Error caught - " + (error instanceof Error ? error.message : String(error)));

    // Check if this is a "no paused goal" scenario (not an error for hooks)
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isNoPausedGoal = errorMessage.includes("No paused goal found");

    // Log to file
    container.logger.error(
      "[work.resume] ERROR caught in workResume",
      error instanceof Error ? error : new Error(String(error)),
      { errorType: typeof error, isNoPausedGoal }
    );
    debugLog("Logged error to container.logger");

    // Flush logger before exiting to ensure error is written
    if (container.logger.flush) {
      await container.logger.flush();
      debugLog("Flushed logger");
    }

    if (isNoPausedGoal) {
      // Not an error - just no paused work. Exit cleanly for hooks.
      debugLog("No paused goal - exiting cleanly");
      renderer.info("No paused goal to resume");
    } else {
      // Actual error - render error and fail
      debugLog("About to call renderer.error()");
      renderer.error("Failed to resume work", error instanceof Error ? error : String(error));
      debugLog("Called renderer.error(), about to exit");
      process.exit(1);
    }
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
