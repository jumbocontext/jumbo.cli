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
import { GoalRemoveOutputBuilder } from "./GoalRemoveOutputBuilder.js";

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
  const outputBuilder = new GoalRemoveOutputBuilder();

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

    // Build and render success output
    const output = outputBuilder.buildSuccess(result.goalId, view?.objective || options.goalId);
    renderer.info(output.toHumanReadable());
  } catch (error) {
    const output = outputBuilder.buildFailureError(error instanceof Error ? error : String(error));
    renderer.info(output.toHumanReadable());
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
