/**
 * CLI Command: jumbo goal reject
 *
 * Rejects a goal after failed QA review.
 * Transitions goal from 'in-review' to 'rejected' status,
 * records review issues, and releases the reviewer's claim.
 */

import { CommandMetadata, CONTINUE_OPTION } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { GoalRejectOutputBuilder } from "./GoalRejectOutputBuilder.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Reject a goal after failed QA review",
  category: "work",
  requiredOptions: [
    {
      flags: "-i, --id <id>",
      description: "ID of the goal to reject"
    },
    {
      flags: "-r, --review-issues <issues>",
      description: "Description of implementation problems that need fixing"
    }
  ],
  options: [CONTINUE_OPTION],
  examples: [
    {
      command: 'jumbo goal reject --id goal_abc123 --review-issues "Missing error handling in API endpoint"',
      description: "Reject a goal with review issues"
    }
  ],
  related: ["goal review", "goal qualify", "goal start"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalReject(
  options: { id: string; reviewIssues: string; continue?: boolean },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();
  const outputBuilder = new GoalRejectOutputBuilder();

  try {
    // 1. Execute via controller
    const response = await container.rejectGoalController.handle({
      goalId: options.id,
      reviewIssues: options.reviewIssues,
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
