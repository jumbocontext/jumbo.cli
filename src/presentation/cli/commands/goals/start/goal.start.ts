/**
 * CLI Command: jumbo goal start
 *
 * Starts a refined goal (transitions status from 'refined' to 'doing').
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { GoalStartOutputBuilder } from "./GoalStartOutputBuilder.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Start a refined goal (transitions status from 'refined' to 'doing')",
  category: "work",
  requiredOptions: [
    {
      flags: "-i, --id <id>",
      description: "[required]ID of the goal to start"
    }
  ],
  examples: [
    {
      command: "jumbo goal start --id goal_abc123",
      description: "Start working on the goal with ID 'goal_abc123'"
    }
  ],
  related: ["goal update-progress", "goal complete"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalStart(options: { id: string }, container: IApplicationContainer) {
  const renderer = Renderer.getInstance();

  try {
    const response = await container.startGoalController.handle({
      goalId: options.id,
    });

    // Build and render output using builder pattern
    const outputBuilder = new GoalStartOutputBuilder();
    const output = outputBuilder.build(response.goalContextView);

    renderer.info(output.toHumanReadable());

  } catch (error) {
    renderer.error("Failed to start goal", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}
