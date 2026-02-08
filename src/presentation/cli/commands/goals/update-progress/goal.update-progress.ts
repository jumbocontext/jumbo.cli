/**
 * CLI Command: jumbo goal update-progress
 *
 * Appends a task description to a goal's progress array.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { UpdateGoalProgressCommandHandler } from "../../../../../application/goals/update-progress/UpdateGoalProgressCommandHandler.js";
import { UpdateGoalProgressCommand } from "../../../../../application/goals/update-progress/UpdateGoalProgressCommand.js";

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
    // 1. Create command handler with dependencies from container
    const commandHandler = new UpdateGoalProgressCommandHandler(
      container.goalProgressUpdatedEventStore,
      container.goalProgressUpdatedEventStore,
      container.goalProgressUpdatedProjector,
      container.eventBus
    );

    // 2. Execute command
    const command: UpdateGoalProgressCommand = {
      goalId: options.goalId,
      taskDescription: options.taskDescription
    };
    const result = await commandHandler.execute(command);

    // 3. Render success output
    renderer.success("Progress updated", {
      goalId: result.goalId,
      addedTask: options.taskDescription.trim(),
      totalProgress: result.progress.length,
    });

    // 4. Render progress list
    if (result.progress.length > 0) {
      renderer.section("Progress:");
      result.progress.forEach((task, index) => {
        renderer.info(`  ${index + 1}. ${task}`);
      });
    }
  } catch (error) {
    renderer.error("Failed to update progress", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}
