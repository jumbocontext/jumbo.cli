/**
 * CLI Command: jumbo work pause
 *
 * Pauses the current worker's active goal (transitions status from 'doing' to 'paused').
 * This is a parameterless command that automatically identifies the worker's active goal.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Pause the current worker's active goal",
  category: "work",
  requiredOptions: [],
  options: [],
  examples: [
    {
      command: "jumbo work pause",
      description: "Pause your active goal"
    }
  ],
  related: ["work resume", "goal pause", "goal start"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function workPause(
  _options: Record<string, never>,
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    container.logger.debug("[work.pause] Starting workPause command");

    container.logger.debug("[work.pause] About to execute controller");
    // Execute via controller
    const result = await container.pauseWorkController.handle({});

    container.logger.info("[work.pause] Successfully executed PauseWorkController");

    // Success output
    renderer.success("Work paused", {
      goalId: result.goalId,
      objective: result.objective,
      status: "paused",
      reason: "WorkPaused"
    });
  } catch (error) {
    // Check if this is a "no active goal" scenario (not an error for hooks)
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isNoActiveGoal = errorMessage.includes("No active goal found");

    // Log to file
    container.logger.error(
      "[work.pause] ERROR caught in workPause",
      error instanceof Error ? error : new Error(String(error)),
      { errorType: typeof error, isNoActiveGoal }
    );

    // Flush logger before exiting to ensure error is written
    if (container.logger.flush) {
      await container.logger.flush();
    }

    if (isNoActiveGoal) {
      // Not an error - just no work to pause. Exit cleanly for hooks.
      renderer.info("No active goal to pause");
    } else {
      // Actual error - render error and fail
      renderer.error("Failed to pause work", error instanceof Error ? error : String(error));
      process.exit(1);
    }
  }
}
