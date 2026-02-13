/**
 * CLI Command: jumbo goal reset
 *
 * Resets a goal back to 'to-do' status from 'doing' or 'completed'.
 * Blocked goals cannot be reset to preserve blocker context.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { ResetGoalCommandHandler } from "../../../../../application/goals/reset/ResetGoalCommandHandler.js";
import { ResetGoalCommand } from "../../../../../application/goals/reset/ResetGoalCommand.js";
import { GoalResetOutputBuilder } from "./GoalResetOutputBuilder.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Reset a goal back to 'to-do' status",
  category: "work",
  requiredOptions: [
    {
      flags: "--goal-id <goalId>",
      description: "ID of the goal to reset"
    }
  ],
  examples: [
    {
      command: "jumbo goal reset --goal-id goal_abc123",
      description: "Reset a goal to 'to-do' status"
    }
  ],
  related: ["goal start", "goal complete", "goal unblock"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalReset(options: { goalId: string }, container: IApplicationContainer) {
  const renderer = Renderer.getInstance();
  const outputBuilder = new GoalResetOutputBuilder();

  try {
    // 1. Create command handler
    const commandHandler = new ResetGoalCommandHandler(
      container.goalResetEventStore,
      container.goalResetEventStore,
      container.goalResetProjector,
      container.eventBus,
      container.goalClaimPolicy,
      container.workerIdentityReader
    );

    // 2. Execute command
    const command: ResetGoalCommand = { goalId: options.goalId };
    const result = await commandHandler.execute(command);

    // 3. Fetch updated view for display
    const view = await container.goalResetProjector.findById(result.goalId);

    // Build and render success output
    const output = outputBuilder.buildSuccess(
      result.goalId,
      view?.objective || options.goalId,
      view?.status || 'to-do'
    );
    renderer.info(output.toHumanReadable());
  } catch (error) {
    const output = outputBuilder.buildFailureError(error instanceof Error ? error : String(error));
    renderer.info(output.toHumanReadable());
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
