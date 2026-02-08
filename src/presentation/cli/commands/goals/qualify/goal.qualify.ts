/**
 * CLI Command: jumbo goal qualify
 *
 * Qualifies a goal after successful QA review.
 * Transitions goal from 'in-review' to 'qualified' status and renders completion instructions.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { QualifyGoalRequest } from "../../../../../application/goals/qualify/QualifyGoalRequest.js";
import { QualifyGoalResponse } from "../../../../../application/goals/qualify/QualifyGoalResponse.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Qualify a goal after successful QA review",
  category: "work",
  requiredOptions: [
    {
      flags: "--goal-id <goalId>",
      description: "ID of the goal to qualify"
    }
  ],
  options: [],
  examples: [
    {
      command: "jumbo goal qualify --goal-id goal_abc123",
      description: "Qualify a goal after QA review passes"
    }
  ],
  related: ["goal review", "goal complete", "goal start"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalQualify(
  options: { goalId: string },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    // 1. Get controller from container
    const controller = container.qualifyGoalController;

    // 2. Create request
    const request: QualifyGoalRequest = {
      goalId: options.goalId,
    };

    // 3. Handle request
    const response = await controller.handle(request);

    // 4. Render qualification result with next steps
    renderQualificationResult(renderer, response);
    renderer.divider();

  } catch (error) {
    renderer.error("Failed to qualify goal", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}

/**
 * Render the qualification result with instructions to complete the goal
 */
function renderQualificationResult(
  renderer: Renderer,
  response: QualifyGoalResponse
) {
  // Header
  renderer.headline("# Goal Qualified");
  renderer.info(`Goal ID: ${response.goalId}`);
  renderer.info(`Objective: ${response.objective}`);
  renderer.info(`Status: ${response.status}`);
  renderer.divider();

  // Success message
  renderer.headline("## QA Review Passed");
  renderer.info("The goal has been verified and qualified for completion.");
  renderer.divider();

  // Next steps
  renderer.headline("## Next Steps");
  renderer.info("Complete the goal:");
  renderer.info(`  Run: jumbo goal complete --goal-id ${response.goalId}`);

  if (response.nextGoalId) {
    renderer.info("\nAfter completion, the next goal in the queue is:");
    renderer.info(`  Goal ID: ${response.nextGoalId}`);
  }

  renderer.info("---\n");
}
