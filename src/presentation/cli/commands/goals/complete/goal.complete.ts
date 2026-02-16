/**
 * CLI Command: jumbo goal complete
 *
 * Completes a QUALIFIED goal.
 * Goal must be in QUALIFIED status to be completed.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { CompleteGoalCommandHandler } from "../../../../../application/context/goals/complete/CompleteGoalCommandHandler.js";
import { CompleteGoalCommand } from "../../../../../application/context/goals/complete/CompleteGoalCommand.js";
import { GoalCompleteOutputBuilder } from "./GoalCompleteOutputBuilder.js";

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
    // 1. Create command handler
    const commandHandler = new CompleteGoalCommandHandler(
      container.goalCompletedEventStore,
      container.goalCompletedEventStore,
      container.goalCompletedProjector,
      container.eventBus,
      container.goalClaimPolicy,
      container.workerIdentityReader,
      container.goalContextQueryHandler
    );

    // 2. Execute command - returns enriched goal context view
    const command: CompleteGoalCommand = { goalId: options.goalId };
    const goalContextView = await commandHandler.execute(command);

    // 3. Check for next goal in chain (maintains local business logic)
    let nextGoal;
    if (goalContextView.goal.nextGoalId) {
      const nextGoalView = await container.goalCompletedProjector.findById(goalContextView.goal.nextGoalId);
      if (nextGoalView) {
        nextGoal = {
          goalId: nextGoalView.goalId,
          objective: nextGoalView.objective,
          status: nextGoalView.status,
        };
      }
    }

    // 4. Build and render output using builder pattern
    const outputBuilder = new GoalCompleteOutputBuilder();
    const output = outputBuilder.buildSuccess(goalContextView, nextGoal);

    renderer.info(output.toHumanReadable());

  } catch (error) {
    renderer.error("Failed to complete goal", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}
