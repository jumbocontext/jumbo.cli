/**
 * CLI Command: jumbo goal pause
 *
 * Pauses an active goal (transitions status from 'doing' to 'paused').
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { PauseGoalCommandHandler } from "../../../../../application/goals/pause/PauseGoalCommandHandler.js";
import { PauseGoalCommand } from "../../../../../application/goals/pause/PauseGoalCommand.js";
import { GoalPausedReasons, GoalPausedReasonsType } from "../../../../../domain/goals/GoalPausedReasons.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Pause an active goal (transitions status from 'doing' to 'paused')",
  category: "work",
  requiredOptions: [
    {
      flags: "--goal-id <goalId>",
      description: "ID of the goal to pause"
    },
    {
      flags: "--reason <reason>",
      description: "Reason for pausing (ContextCompressed, WorkPaused, Other)"
    }
  ],
  options: [
    {
      flags: "--note <note>",
      description: "Optional note providing additional context"
    }
  ],
  examples: [
    {
      command: "jumbo goal pause --goal-id goal_abc123 --reason ContextCompressed",
      description: "Pause a goal due to context compression"
    },
    {
      command: "jumbo goal pause --goal-id goal_abc123 --reason Other --note \"Need to switch priorities\"",
      description: "Pause a goal with a custom note"
    }
  ],
  related: ["goal resume", "goal start", "goal block"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalPause(
  options: { goalId: string; reason: string; note?: string },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    // 1. Validate reason
    const validReasons = Object.values(GoalPausedReasons);
    if (!validReasons.includes(options.reason as any)) {
      throw new Error(
        `Invalid reason: ${options.reason}. Valid reasons: ${validReasons.join(", ")}`
      );
    }
    const reason = options.reason as GoalPausedReasonsType;

    // 2. Create command handler
    const commandHandler = new PauseGoalCommandHandler(
      container.goalPausedEventStore,
      container.goalPausedEventStore,
      container.goalPausedProjector,
      container.eventBus
    );

    // 3. Execute command
    const command: PauseGoalCommand = {
      goalId: options.goalId,
      reason,
      note: options.note
    };
    const result = await commandHandler.execute(command);

    // 4. Fetch updated view for display
    const view = await container.goalPausedProjector.findById(result.goalId);

    // Success output
    renderer.success("Goal paused", {
      goalId: result.goalId,
      objective: view?.objective || "",
      status: view?.status || "paused",
      reason: reason,
    });
  } catch (error) {
    renderer.error("Failed to pause goal", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
