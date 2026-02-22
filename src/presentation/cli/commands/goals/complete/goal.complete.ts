/**
 * CLI Command: jumbo goal complete
 *
 * Completes a QUALIFIED goal.
 * Goal must be in QUALIFIED status to be completed.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { GoalCompleteOutputBuilder } from "./GoalCompleteOutputBuilder.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Mark a qualified goal as completed",
  category: "work",
  requiredOptions: [
    {
      flags: "-i, --id <id>",
      description: "ID of the goal to complete"
    }
  ],
  options: [],
  examples: [
    {
      command: "jumbo goal complete --id goal_abc123",
      description: "Complete a qualified goal"
    }
  ],
  related: ["goal add", "goal start", "goal review"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalComplete(
  options: { id: string },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    // 1. Execute via controller
    const response = await container.completeGoalController.handle({
      goalId: options.id,
    });

    // 2. Build and render output using builder pattern
    const outputBuilder = new GoalCompleteOutputBuilder();
    const output = outputBuilder.buildSuccess(response);

    renderer.info(output.toHumanReadable());

  } catch (error) {
    renderer.error("Failed to complete goal", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}
