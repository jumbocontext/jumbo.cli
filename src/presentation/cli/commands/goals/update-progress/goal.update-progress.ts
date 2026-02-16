/**
 * CLI Command: jumbo goal update-progress
 *
 * Appends a task description to a goal's progress array.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { UpdateGoalProgressCommandHandler } from "../../../../../application/context/goals/update-progress/UpdateGoalProgressCommandHandler.js";
import { UpdateGoalProgressCommand } from "../../../../../application/context/goals/update-progress/UpdateGoalProgressCommand.js";
import { GoalUpdateProgressOutputBuilder } from "./GoalUpdateProgressOutputBuilder.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Append a task description to a goal's progress",
  category: "work",
  requiredOptions: [
    {
      flags: "--goal-id <goalId>",
      description: "ID of the goal to update progress on"
    },
    {
      flags: "--task-description <taskDescription>",
      description: "Description of the completed sub-task"
    }
  ],
  options: [],
  examples: [
    {
      command: "jumbo goal update-progress --goal-id goal_abc123 --task-description \"Implemented user login form\"",
      description: "Record progress on a goal"
    }
  ],
  related: ["goal start", "goal complete", "goal show"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalUpdateProgress(
  options: { goalId: string; taskDescription: string },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    // 1. Create command handler
    const commandHandler = new UpdateGoalProgressCommandHandler(
      container.goalProgressUpdatedEventStore,
      container.goalProgressUpdatedEventStore,
      container.goalProgressUpdatedProjector,
      container.eventBus,
      container.goalContextQueryHandler
    );

    // 2. Execute command - returns enriched goal context view
    const command: UpdateGoalProgressCommand = {
      goalId: options.goalId,
      taskDescription: options.taskDescription
    };
    const goalContextView = await commandHandler.execute(command);

    // 3. Build and render output using builder pattern
    const outputBuilder = new GoalUpdateProgressOutputBuilder();
    const output = outputBuilder.build(goalContextView, options.taskDescription.trim());

    renderer.info(output.toHumanReadable());

  } catch (error) {
    renderer.error("Failed to update progress", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}
