/**
 * CLI Command: jumbo goal codify
 *
 * Starts the codify phase on an approved goal.
 * Transitions goal from 'approved' to 'codifying' status and acquires a claim.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { GoalCodifyOutputBuilder } from "./GoalCodifyOutputBuilder.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Start the codify phase on an approved goal (architectural reconciliation)",
  category: "work",
  requiredOptions: [
    {
      flags: "-i, --id <id>",
      description: "ID of the goal to codify"
    }
  ],
  options: [],
  examples: [
    {
      command: "jumbo goal codify --id goal_abc123",
      description: "Start codifying an approved goal"
    }
  ],
  related: ["goal approve", "goal close"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalCodify(
  options: { id: string },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    // 1. Execute via controller
    const response = await container.codifyGoalController.handle({
      goalId: options.id,
    });

    // 2. Build and render output using builder pattern
    const outputBuilder = new GoalCodifyOutputBuilder();
    const output = outputBuilder.buildSuccess(response);

    renderer.info(output.toHumanReadable());

  } catch (error) {
    renderer.error("Failed to codify goal", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}
