/**
 * CLI Command: jumbo goal close
 *
 * Closes a goal after codification is complete.
 * Transitions goal from 'codifying' to 'done' status and releases the claim.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { GoalCloseOutputBuilder } from "./GoalCloseOutputBuilder.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Close a goal after codification is complete (transitions to done)",
  category: "work",
  requiredOptions: [
    {
      flags: "-i, --id <id>",
      description: "ID of the goal to close"
    }
  ],
  options: [],
  examples: [
    {
      command: "jumbo goal close --id goal_abc123",
      description: "Close a goal after codification"
    }
  ],
  related: ["goal codify", "goal start"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalClose(
  options: { id: string },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    // 1. Execute via controller
    const response = await container.closeGoalController.handle({
      goalId: options.id,
    });

    // 2. Build and render output using builder pattern
    const outputBuilder = new GoalCloseOutputBuilder();
    const output = outputBuilder.buildSuccess(response);

    renderer.info(output.toHumanReadable());

  } catch (error) {
    renderer.error("Failed to close goal", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}
