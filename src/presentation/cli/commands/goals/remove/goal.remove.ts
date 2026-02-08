/**
 * CLI Command: jumbo goal remove
 *
 * Removes a goal from tracking (does not delete event history).
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { RemoveGoalCommandHandler } from "../../../../../application/goals/remove/RemoveGoalCommandHandler.js";
import { RemoveGoalCommand } from "../../../../../application/goals/remove/RemoveGoalCommand.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Remove a goal from tracking",
  category: "work",
  requiredOptions: [
    {
      flags: "--goal-id <goalId>",
      description: "ID of the goal to remove"
    }
  ],
  examples: [
    {
      command: "jumbo goal remove --goal-id goal_abc123",
      description: "Remove a goal"
    }
  ],
  related: ["goal add", "goal complete"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalRemove(options: { goalId: string }, container: IApplicationContainer) {
  const renderer = Renderer.getInstance();

  try {
    // 1. Fetch view before removal for display
    const view = await container.goalRemovedProjector.findById(options.goalId);

    // 2. Create command handler
    const commandHandler = new RemoveGoalCommandHandler(
      container.goalRemovedEventStore,
      container.goalRemovedEventStore,
      container.goalRemovedProjector,
      container.eventBus
    );

    // 3. Execute command
    const command: RemoveGoalCommand = { goalId: options.goalId };
    const result = await commandHandler.execute(command);

    // Success output
    renderer.success("Goal removed", {
      goalId: result.goalId,
      objective: view?.objective || options.goalId
    });
  } catch (error) {
    renderer.error("Failed to remove goal", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
