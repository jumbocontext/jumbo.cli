/**
 * CLI Command: jumbo goal qualify
 *
 * Qualifies a goal after successful QA review.
 * Transitions goal from 'in-review' to 'approved' status and renders codification instructions.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { GoalQualifyOutputBuilder } from "./GoalQualifyOutputBuilder.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Qualify a goal after successful QA review",
  category: "work",
  requiredOptions: [
    {
      flags: "-i, --id <id>",
      description: "ID of the goal to qualify"
    }
  ],
  options: [],
  examples: [
    {
      command: "jumbo goal qualify --id goal_abc123",
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
  options: { id: string },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    // 1. Emit deprecation warning
    const outputBuilder = new GoalQualifyOutputBuilder();
    const warning = outputBuilder.buildDeprecationWarning();
    renderer.info(warning.toHumanReadable());

    // 2. Execute via controller
    const response = await container.qualifyGoalController.handle({
      goalId: options.id,
    });

    // 3. Build and render output using builder pattern
    const output = outputBuilder.buildSuccess(response);

    renderer.info(output.toHumanReadable());

  } catch (error) {
    renderer.error("Failed to qualify goal", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}
