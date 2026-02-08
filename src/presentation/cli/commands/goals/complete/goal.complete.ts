/**
 * CLI Command: jumbo goal complete
 *
 * Completes a QUALIFIED goal.
 * Goal must be in QUALIFIED status to be completed.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { CompleteGoalRequest } from "../../../../../application/goals/complete/CompleteGoalRequest.js";
import { CompleteGoalResponse } from "../../../../../application/goals/complete/CompleteGoalResponse.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Mark a qualified goal as completed",
  category: "work",
  requiredOptions: [
    {
      flags: "--goal-id <goalId>",
      description: "ID of the goal to complete"
    }
  ],
  options: [],
  examples: [
    {
      command: "jumbo goal complete --goal-id goal_abc123",
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
  options: { goalId: string },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    // 1. Get controller from container
    const controller = container.completeGoalController;

    // 2. Create request
    const request: CompleteGoalRequest = {
      goalId: options.goalId,
    };

    // 3. Handle request
    const response = await controller.handle(request);

    // 4. Render completion response
    renderCompletedContext(renderer, response);
    renderer.divider();

  } catch (error) {
    renderer.error("Failed to complete goal", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}

function renderCompletedContext(
  renderer: Renderer,
  response: CompleteGoalResponse
){
  // Render capture learning prompt
  renderer.headline("# Goal Completed - Capture Learnings");
  renderer.info("@LLM: Reflect:");
  renderer.info("Did your interaction with the user while implementing this goal surface uncaptured invariants, guidelines, decisions, components, dependencies, or architectural patterns?");
  renderer.info("Were you corrected in any way that highlights a missing invariant, guideline, decision, component, dependency, or architectural pattern that should be captured?");
  renderer.info("If you answer 'yes' to any of these questions, propose additions to the knowledge base.");
  renderer.info("Only propose additions if they are:");
  renderer.info("  - Universal (applicable beyond this specific goal)");
  renderer.info("  - Dense (one sentence, no examples unless the example IS the rule)");
  renderer.info("  - Actionable (changes how code is written or decisions are made)");
  renderer.info("Capturable types: invariant, guideline, decision, component, dependency, architecture.");
  renderer.info("If nothing qualifies, say so. Avoid restating what's already captured.");
  renderer.info("Run 'jumbo --help' for command details.");

  // If next goal in chain
  if (response.nextGoal) {
    // Render next goal if present
    renderer.headline("## Next goal in chain:");
    renderer.data({
      goalId: response.nextGoal.goalId,
      objective: response.nextGoal.objective,
      status: response.nextGoal.status,
    });
    renderer.info("Start the next goal immediately. Run:");
    renderer.info(`  jumbo goal start --goal-id ${response.nextGoal.goalId}`);
  }
}
