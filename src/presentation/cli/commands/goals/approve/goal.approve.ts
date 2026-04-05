/**
 * CLI Command: jumbo goal approve
 *
 * Approves a goal after successful QA review.
 * Transitions goal from 'in-review' to 'approved' status and renders codification instructions.
 *
 * This is the primary command for review approval.
 * See also: goal.qualify (deprecated alias).
 */

import { CommandMetadata, CONTINUE_OPTION } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { GoalApproveOutputBuilder } from "./GoalApproveOutputBuilder.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Approve a goal after successful QA review",
  category: "work",
  requiredOptions: [
    {
      flags: "-i, --id <id>",
      description: "ID of the goal to approve"
    }
  ],
  options: [CONTINUE_OPTION],
  examples: [
    {
      command: "jumbo goal approve --id goal_abc123",
      description: "Approve a goal after QA review passes"
    }
  ],
  related: ["goal review", "goal complete", "goal start"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalApprove(
  options: { id: string; continue?: boolean },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  const outputBuilder = new GoalApproveOutputBuilder();

  try {
    // 1. Execute via controller (delegates to same QualifyGoalController)
    const response = await container.qualifyGoalController.handle({
      goalId: options.id,
    });

    // 2. Build and render output using builder pattern
    const output = outputBuilder.buildSuccess(response, options.continue === true);
    renderer.info(output.toHumanReadable());

  } catch (error) {
    const errorOutput = outputBuilder.buildFailureError(error instanceof Error ? error : String(error));
    renderer.error(errorOutput.toHumanReadable());
    process.exit(1);
  }
}
