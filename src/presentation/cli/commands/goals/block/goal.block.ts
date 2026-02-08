/**
 * CLI Command: jumbo goal block
 *
 * Blocks a goal with a reason when progress is impeded.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { BlockGoalCommandHandler } from "../../../../../application/goals/block/BlockGoalCommandHandler.js";
import { BlockGoalCommand } from "../../../../../application/goals/block/BlockGoalCommand.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Mark a goal as blocked with reason",
  category: "work",
  requiredOptions: [
    {
      flags: "--goal-id <goalId>",
      description: "ID of the goal to block"
    },
    {
      flags: "--note <reason>",
      description: "Reason why the goal is blocked"
    }
  ],
  examples: [
    {
      command: "jumbo goal block --goal-id goal_abc123 --note \"Waiting for API credentials\"",
      description: "Block a goal with a reason"
    }
  ],
  related: ["goal unblock", "goal start", "goal add"]
};

export async function goalBlock(
  options: {
    goalId: string;
    note: string;
  },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    // 1. Create command handler
    const commandHandler = new BlockGoalCommandHandler(
      container.goalBlockedEventStore,
      container.goalBlockedEventStore,
      container.eventBus
    );

    // 2. Execute command
    const command: BlockGoalCommand = {
      goalId: options.goalId,
      note: options.note
    };

    await commandHandler.execute(command);

    // Success output
    renderer.success("Goal blocked", {
      goalId: options.goalId,
      reason: options.note
    });
  } catch (error) {
    renderer.error("Failed to block goal", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
