/**
 * CLI Command: jumbo goal submit
 *
 * Submits a goal after implementation is complete.
 * Transitions goal from 'doing' to 'submitted' status and releases the implementer's claim.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { GoalSubmitOutputBuilder } from "./GoalSubmitOutputBuilder.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Submit a goal after implementation is complete",
  category: "work",
  requiredOptions: [
    {
      flags: "-i, --id <id>",
      description: "ID of the goal to submit"
    }
  ],
  options: [],
  examples: [
    {
      command: "jumbo goal submit --id goal_abc123",
      description: "Submit a goal after implementation is complete"
    }
  ],
  related: ["goal start", "goal review", "goal reject"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalSubmit(
  options: { id: string },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();
  const outputBuilder = new GoalSubmitOutputBuilder();

  try {
    // 1. Execute via controller
    const response = await container.submitGoalController.handle({
      goalId: options.id,
    });

    // 2. Build and render output using builder pattern
    const output = outputBuilder.buildSuccess(response);
    renderer.info(output.toHumanReadable());

  } catch (error) {
    const errorOutput = outputBuilder.buildFailureError(error instanceof Error ? error : String(error));
    renderer.error(errorOutput.toHumanReadable());
    process.exit(1);
  }
}
