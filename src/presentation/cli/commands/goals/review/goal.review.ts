/**
 * CLI Command: jumbo goal review
 *
 * Starts QA review on a submitted goal.
 * Transitions goal from 'submitted' to 'in-review' status and renders QA criteria.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { ReviewGoalRequest } from "../../../../../application/context/goals/review/ReviewGoalRequest.js";
import { GoalReviewOutputBuilder } from "./GoalReviewOutputBuilder.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Start QA review on a submitted goal",
  category: "work",
  requiredOptions: [
    {
      flags: "-i, --id <id>",
      description: "ID of the goal to review"
    }
  ],
  options: [],
  examples: [
    {
      command: "jumbo goal review --id goal_abc123",
      description: "Start QA review on a submitted goal"
    }
  ],
  related: ["goal submit", "goal qualify", "goal reject"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalReview(
  options: { id: string },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    // 1. Get controller from container
    const controller = container.reviewGoalController;

    // 2. Create request
    const request: ReviewGoalRequest = {
      goalId: options.id,
    };

    // 3. Handle request
    const response = await controller.handle(request);

    // 4. Build and render output using builder pattern
    const outputBuilder = new GoalReviewOutputBuilder();
    const output = outputBuilder.buildSuccess(response);

    renderer.info(output.toHumanReadable());
    renderer.divider();

  } catch (error) {
    renderer.error("Failed to submit goal for review", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}

