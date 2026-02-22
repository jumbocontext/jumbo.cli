/**
 * CLI Command: jumbo goal reset
 *
 * Resets a goal back to 'to-do' status from 'doing' or 'completed'.
 * Blocked goals cannot be reset to preserve blocker context.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { GoalResetOutputBuilder } from "./GoalResetOutputBuilder.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Reset a goal back to 'to-do' status",
  category: "work",
  requiredOptions: [
    {
      flags: "-i, --id <id>",
      description: "ID of the goal to reset"
    }
  ],
  examples: [
    {
      command: "jumbo goal reset --id goal_abc123",
      description: "Reset a goal to 'to-do' status"
    }
  ],
  related: ["goal start", "goal complete", "goal unblock"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalReset(options: { id: string }, container: IApplicationContainer) {
  const renderer = Renderer.getInstance();
  const outputBuilder = new GoalResetOutputBuilder();

  try {
    const response = await container.resetGoalController.handle({
      goalId: options.id,
    });

    // Build and render success output
    const output = outputBuilder.buildSuccess(
      response.goalId,
      response.objective,
      response.status
    );
    renderer.info(output.toHumanReadable());
  } catch (error) {
    const output = outputBuilder.buildFailureError(error instanceof Error ? error : String(error));
    renderer.info(output.toHumanReadable());
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
