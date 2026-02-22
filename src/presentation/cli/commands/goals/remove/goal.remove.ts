/**
 * CLI Command: jumbo goal remove
 *
 * Removes a goal from tracking (does not delete event history).
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { GoalRemoveOutputBuilder } from "./GoalRemoveOutputBuilder.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Remove a goal from tracking",
  category: "work",
  requiredOptions: [
    {
      flags: "-i, --id <id>",
      description: "ID of the goal to remove"
    }
  ],
  examples: [
    {
      command: "jumbo goal remove --id goal_abc123",
      description: "Remove a goal"
    }
  ],
  related: ["goal add", "goal complete"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalRemove(options: { id: string }, container: IApplicationContainer) {
  const renderer = Renderer.getInstance();
  const outputBuilder = new GoalRemoveOutputBuilder();

  try {
    const response = await container.removeGoalController.handle({
      goalId: options.id,
    });

    const output = outputBuilder.buildSuccess(response.goalId, response.objective);
    renderer.info(output.toHumanReadable());
  } catch (error) {
    const output = outputBuilder.buildFailureError(error instanceof Error ? error : String(error));
    renderer.info(output.toHumanReadable());
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
