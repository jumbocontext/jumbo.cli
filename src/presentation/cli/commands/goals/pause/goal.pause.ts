/**
 * CLI Command: jumbo goal pause
 *
 * Pauses an active goal (transitions status from 'doing' to 'paused').
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { GoalPausedReasons, GoalPausedReasonsType } from "../../../../../domain/goals/GoalPausedReasons.js";
import { GoalPauseOutputBuilder } from "./GoalPauseOutputBuilder.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Pause an active goal (transitions status from 'doing' to 'paused')",
  category: "work",
  requiredOptions: [
    {
      flags: "-i, --id <id>",
      description: "ID of the goal to pause"
    },
    {
      flags: "-r, --reason <reason>",
      description: "Reason for pausing (ContextCompressed, WorkPaused, Other)"
    }
  ],
  options: [
    {
      flags: "-N, --note <note>",
      description: "Optional note providing additional context"
    }
  ],
  examples: [
    {
      command: "jumbo goal pause --id goal_abc123 --reason ContextCompressed",
      description: "Pause a goal due to context compression"
    },
    {
      command: "jumbo goal pause --id goal_abc123 --reason Other --note \"Need to switch priorities\"",
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
  options: { id: string; reason: string; note?: string },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();
  const outputBuilder = new GoalPauseOutputBuilder();

  try {
    const response = await container.pauseGoalController.handle({
      goalId: options.id,
      reason: options.reason as GoalPausedReasonsType,
      note: options.note,
    });

    const output = outputBuilder.buildSuccess(
      response.goalId,
      response.objective,
      response.status,
      response.reason as GoalPausedReasonsType
    );
    renderer.info(output.toHumanReadable());
  } catch (error) {
    const output = outputBuilder.buildFailureError(error instanceof Error ? error : String(error));
    renderer.info(output.toHumanReadable());
    process.exit(1);
  }
}
