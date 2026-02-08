/**
 * CLI Command: jumbo goal unblock
 *
 * Unblocks a goal and resumes work after a blocker has been resolved.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { UnblockGoalCommandHandler } from "../../../../../application/goals/unblock/UnblockGoalCommandHandler.js";
import { UnblockGoalCommand } from "../../../../../application/goals/unblock/UnblockGoalCommand.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Unblock a goal and resume work",
  category: "work",
  requiredOptions: [
    {
      flags: "--goal-id <goalId>",
      description: "ID of the goal to unblock"
    }
  ],
  options: [
    {
      flags: "--note <resolution>",
      description: "Optional resolution note explaining how the blocker was resolved"
    }
  ],
  examples: [
    {
      command: "jumbo goal unblock --goal-id goal_abc123",
      description: "Unblock a goal"
    },
    {
      command: "jumbo goal unblock --goal-id goal_abc123 --note \"API credentials received\"",
      description: "Unblock a goal with resolution note"
    }
  ],
  related: ["goal block", "goal start", "goal complete"]
};

export async function goalUnblock(
  options: {
    goalId: string;
    note?: string;
  },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    // 1. Create command handler
    const commandHandler = new UnblockGoalCommandHandler(
      container.goalUnblockedEventStore,
      container.goalUnblockedEventStore,
      container.eventBus
    );

    // 2. Execute command
    const command: UnblockGoalCommand = {
      goalId: options.goalId,
      note: options.note
    };

    await commandHandler.execute(command);

    // Success output
    const data: Record<string, string> = { goalId: options.goalId };
    if (options.note) {
      data.resolution = options.note;
    }
    renderer.success("Goal unblocked", data);
  } catch (error) {
    renderer.error("Failed to unblock goal", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
