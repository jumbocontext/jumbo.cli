/**
 * CLI Command: jumbo goal start
 *
 * Starts a refined goal (transitions status from 'refined' to 'doing').
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { StartGoalCommandHandler } from "../../../../../application/context/goals/start/StartGoalCommandHandler.js";
import { StartGoalCommand } from "../../../../../application/context/goals/start/StartGoalCommand.js";
import { GoalStartOutputBuilder } from "./GoalStartOutputBuilder.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Start a refined goal (transitions status from 'refined' to 'doing')",
  category: "work",
  requiredOptions: [
    {
      flags: "--goal-id <goalId>",
      description: "[required]ID of the goal to start"
    }
  ],
  examples: [
    {
      command: "jumbo goal start --goal-id goal_abc123",
      description: "Start working on the goal with ID 'goal_abc123'"
    }
  ],
  related: ["goal update-progress", "goal complete"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalStart(options: { goalId: string }, container: IApplicationContainer) {
  const renderer = Renderer.getInstance();

  try {
    // 1. Create command handler
    const commandHandler = new StartGoalCommandHandler(
      container.goalStartedEventStore,
      container.goalStartedEventStore,
      container.goalStartedProjector,
      container.eventBus,
      container.goalClaimPolicy,
      container.workerIdentityReader,
      container.settingsReader,
      container.goalContextQueryHandler
    );

    // 2. Execute command - returns enriched goal context view
    const command: StartGoalCommand = { goalId: options.goalId };
    const goalContextView = await commandHandler.execute(command);

    // 3. Build and render output using builder pattern
    const outputBuilder = new GoalStartOutputBuilder();
    const output = outputBuilder.build(goalContextView);

    renderer.info(output.toHumanReadable());

  } catch (error) {
    renderer.error("Failed to start goal", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}
