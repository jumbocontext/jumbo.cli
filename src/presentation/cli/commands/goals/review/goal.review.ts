/**
 * CLI Command: jumbo goal review
 *
 * Submits a goal for QA review.
 * Transitions goal from 'doing' to 'in-review' status and renders QA criteria.
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
  description: "Submit a goal for QA review",
  category: "work",
  requiredOptions: [
    {
      flags: "-i, --id <id>",
      description: "ID of the goal to submit for review"
    }
  ],
  options: [],
  examples: [
    {
      command: "jumbo goal review --id goal_abc123",
      description: "Submit a goal for QA review"
    }
  ],
  related: ["goal start", "goal qualify", "goal complete", "goal pause"]
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

