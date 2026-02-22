/**
 * CLI Command: jumbo goal unblock
 *
 * Unblocks a goal and resumes work after a blocker has been resolved.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { GoalUnblockOutputBuilder } from "./GoalUnblockOutputBuilder.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Unblock a goal and resume work",
  category: "work",
  requiredOptions: [
    {
      flags: "-i, --id <id>",
      description: "ID of the goal to unblock"
    }
  ],
  options: [
    {
      flags: "-N, --note <resolution>",
      description: "Optional resolution note explaining how the blocker was resolved"
    }
  ],
  examples: [
    {
      command: "jumbo goal unblock --id goal_abc123",
      description: "Unblock a goal"
    },
    {
      command: "jumbo goal unblock --id goal_abc123 --note \"API credentials received\"",
      description: "Unblock a goal with resolution note"
    }
  ],
  related: ["goal block", "goal start", "goal complete"]
};

export async function goalUnblock(
  options: {
    id: string;
    note?: string;
  },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();
  const outputBuilder = new GoalUnblockOutputBuilder();

  try {
    const { goalId, note } = await container.unblockGoalController.handle({
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
