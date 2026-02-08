/**
 * CLI Command: jumbo work pause
 *
 * Pauses the current worker's active goal (transitions status from 'doing' to 'paused').
 * This is a parameterless command that automatically identifies the worker's active goal.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { PauseWorkCommandHandler } from "../../../../../application/work/pause/PauseWorkCommandHandler.js";

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
    // Create command handler with dependencies from container
    const commandHandler = new PauseWorkCommandHandler(
      container.workerIdentityReader,
      container.goalStatusReader,
      container.goalPausedEventStore,
      container.goalPausedEventStore,
      container.goalPausedProjector,
      container.eventBus
    );

    // Execute command
    const result = await commandHandler.execute({});

    // Success output
    renderer.success("Work paused", {
      goalId: result.goalId,
      objective: result.objective,
      status: "paused",
      reason: "WorkPaused"
    });
  } catch (error) {
    renderer.error("Failed to pause work", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}
