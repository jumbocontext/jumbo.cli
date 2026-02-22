/**
 * CLI Command: jumbo goal block
 *
 * Blocks a goal with a reason when progress is impeded.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { GoalBlockOutputBuilder } from "./GoalBlockOutputBuilder.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Mark a goal as blocked with reason",
  category: "work",
  requiredOptions: [
    {
      flags: "-i, --id <id>",
      description: "ID of the goal to block"
    },
    {
      flags: "-N, --note <reason>",
      description: "Reason why the goal is blocked"
    }
  ],
  examples: [
    {
      command: "jumbo goal block --id goal_abc123 --note \"Waiting for API credentials\"",
      description: "Block a goal with a reason"
    }
  ],
  related: ["goal unblock", "goal start", "goal add"]
};

export async function goalBlock(
  options: {
    id: string;
    note: string;
  },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();
  const outputBuilder = new GoalBlockOutputBuilder();

  try {
    const { goalId, note } = await container.blockGoalController.handle({
      goalId: options.id,
      note: options.note,
    });

    // Build and render success output
    const output = outputBuilder.buildSuccess(goalId, note);
    renderer.info(output.toHumanReadable());
  } catch (error) {
    const output = outputBuilder.buildFailureError(error instanceof Error ? error : String(error));
    renderer.info(output.toHumanReadable());
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
