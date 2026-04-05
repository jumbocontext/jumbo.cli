/**
 * CLI Command: jumbo goal commit
 *
 * Commits a goal after refinement is complete.
 * Transitions goal from 'in-refinement' to 'refined' status and releases the claim.
 */

import { CommandMetadata, CONTINUE_OPTION } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { GoalCommitOutputBuilder } from "./GoalCommitOutputBuilder.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Commit a goal after refinement is complete",
  category: "work",
  requiredOptions: [
    {
      flags: "-i, --id <id>",
      description: "ID of the goal to commit"
    }
  ],
  options: [CONTINUE_OPTION],
  examples: [
    {
      command: "jumbo goal commit --id goal_abc123",
      description: "Commit the goal after refinement is complete"
    }
  ],
  related: ["goal refine", "goal start", "relation add"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalCommit(
  options: { id: string; continue?: boolean },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();
  const outputBuilder = new GoalCommitOutputBuilder();

  try {
    // 1. Execute via controller
    const response = await container.commitGoalController.handle({
      goalId: options.id,
    });

    // 2. Build and render output using builder pattern
    const output = outputBuilder.buildSuccess(response.goalId, response.status, options.continue === true);
    renderer.info(output.toHumanReadable());

  } catch (error) {
    const errorOutput = outputBuilder.buildFailureError(error instanceof Error ? error : String(error));
    renderer.error(errorOutput.toHumanReadable());
    process.exit(1);
  }
}
