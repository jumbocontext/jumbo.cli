/**
 * CLI Command: jumbo goal resume
 *
 * Resumes work on a goal by loading its full context.
 * If the goal is 'paused', transitions it to 'doing' status.
 * If the goal is already 'doing', just reloads context (idempotent).
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { GoalResumeOutputBuilder } from "./GoalResumeOutputBuilder.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Resume work on a goal (transitions 'paused' to 'doing', or reloads context if already 'doing')",
  category: "work",
  requiredOptions: [
    {
      flags: "-i, --id <id>",
      description: "ID of the goal to resume"
    }
  ],
  options: [
    {
      flags: "-N, --note <note>",
      description: "Optional note about resumption (only used when transitioning from 'paused')"
    }
  ],
  examples: [
    {
      command: "jumbo goal resume --id goal_abc123",
      description: "Resume working on a paused or in-progress goal"
    },
    {
      command: "jumbo goal resume --id goal_abc123 --note \"Ready to continue\"",
      description: "Resume a paused goal with a note"
    }
  ],
  related: ["goal pause", "goal start", "goal complete"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalResume(options: { id: string; note?: string }, container: IApplicationContainer) {
  const renderer = Renderer.getInstance();

  try {
    const response = await container.resumeGoalController.handle({
      goalId: options.id,
      note: options.note,
    });

    // Build and render output using builder pattern
    const outputBuilder = new GoalResumeOutputBuilder();
    const output = outputBuilder.build(response.contextualGoalView);

    renderer.info(output.toHumanReadable());

  } catch (error) {
    renderer.error("Failed to resume goal", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}
