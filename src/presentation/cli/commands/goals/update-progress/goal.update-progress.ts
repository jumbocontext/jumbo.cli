/**
 * CLI Command: jumbo goal update-progress
 *
 * Appends a task description to a goal's progress array.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { GoalUpdateProgressOutputBuilder } from "./GoalUpdateProgressOutputBuilder.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Append a task description to a goal's progress",
  category: "work",
  requiredOptions: [
    {
      flags: "-i, --id <id>",
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
      command: "jumbo goal update-progress --id goal_abc123 --task-description \"Implemented user login form\"",
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
  options: { id: string; taskDescription: string },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    const response = await container.updateGoalProgressController.handle({
      goalId: options.id,
      taskDescription: options.taskDescription,
    });

    // Build and render output using builder pattern
    const outputBuilder = new GoalUpdateProgressOutputBuilder();
    const output = outputBuilder.build(response.goalContextView, options.taskDescription.trim());

    renderer.info(output.toHumanReadable());

  } catch (error) {
    renderer.error("Failed to update progress", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}
