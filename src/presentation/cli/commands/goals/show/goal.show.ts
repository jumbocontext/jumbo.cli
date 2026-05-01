/**
 * CLI Command: jumbo goal show
 *
 * Displays full goal details including objective, status, success criteria,
 * scope, and notes.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { GoalShowOutputBuilder } from "./GoalShowOutputBuilder.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Display full goal details",
  category: "work",
  requiredOptions: [
    {
      flags: "-i, --id <id>",
      description: "ID of the goal to show"
    }
  ],
  examples: [
    {
      command: "jumbo goal show --id abc123",
      description: "Show complete goal details"
    }
  ],
  related: ["goal add", "goal start", "goal update", "goal complete"],
  requiresProject: true
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalShow(
  options: { id: string },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    // 1. Execute via controller — returns typed response
    const { contextualGoalView } = await container.showGoalController.handle({
      goalId: options.id
    });

    // 2. Build and render output using builder pattern
    // Preserve TTY vs pipe behavior: formatted text for humans, JSON for machines
    const outputBuilder = new GoalShowOutputBuilder();
    if (process.stdout.isTTY) {
      const output = outputBuilder.build(contextualGoalView);
      renderer.info(output.toHumanReadable());
    } else {
      const output = outputBuilder.buildStructuredOutput(contextualGoalView);
      // For non-TTY (pipes/redirects), extract data and output as JSON
      const sections = output.getSections();
      const dataSection = sections.find(s => s.type === 'data');
      if (dataSection) {
        renderer.data(dataSection.content as Record<string, unknown>);
      }
    }

  } catch (error) {
    const outputBuilder = new GoalShowOutputBuilder();

    // Handle goal not found case
    if (error instanceof Error && error.message.includes("Goal not found")) {
      const output = outputBuilder.buildGoalNotFoundError(options.id);
      renderer.info(output.toHumanReadable());
      process.exit(1);
    }

    // Handle other errors
    const output = outputBuilder.buildFailureError(error instanceof Error ? error : String(error));
    renderer.info(output.toHumanReadable());
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
