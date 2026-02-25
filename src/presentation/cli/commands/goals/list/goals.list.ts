/**
 * CLI Command: jumbo goals list
 *
 * Lists goals filtered by status.
 * This is an undocumented command for human oversight.
 *
 * Usage:
 *   jumbo goals list
 *   jumbo goals list --status doing
 *   jumbo goals list --status doing,blocked,paused
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { GoalListOutputBuilder } from "./GoalListOutputBuilder.js";

/**
 * Valid goal statuses for filtering
 */
const VALID_STATUSES = ["defined", "doing", "blocked", "paused", "refined", "in-refinement", "in-review", "approved", "done"] as const;

/**
 * Command metadata for auto-registration
 * Hidden: true - This command is intentionally not shown in --help
 */
export const metadata: CommandMetadata = {
  description: "List goals filtered by status",
  category: "work",
  hidden: true,
  options: [
    {
      flags: "-s, --status <statuses>",
      description: `Filter by status (comma-separated). Valid: ${VALID_STATUSES.join(", ")}`
    }
  ],
  examples: [
    {
      command: "jumbo goals list",
      description: "List all active (non-completed) goals"
    },
    {
      command: "jumbo goals list --status doing",
      description: "List only goals currently being worked on"
    },
    {
      command: "jumbo goals list --status doing,blocked",
      description: "List goals that are doing or blocked"
    }
  ]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalsList(
  options: { status?: string },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    const statuses = options.status
      ? options.status.split(',').map(s => s.trim())
      : undefined;

    const { goals } = await container.getGoalsController.handle({ statuses });

    const outputBuilder = new GoalListOutputBuilder();

    if (goals.length === 0) {
      const message = options.status
        ? `No goals found with status: ${statuses!.join(", ")}`
        : "No active goals. All goals are completed.";
      const output = outputBuilder.buildNoGoalsFound(message);
      renderer.info(output.toHumanReadable());
      return;
    }

    // Preserve TTY vs pipe behavior: formatted text for humans, JSON for machines
    if (process.stdout.isTTY) {
      const output = outputBuilder.buildActiveGoalsList(goals);
      renderer.info(output.toHumanReadable());
    } else {
      const output = outputBuilder.buildStructuredOutput(goals);
      const sections = output.getSections();
      const dataSection = sections.find(s => s.type === 'data');
      if (dataSection) {
        renderer.data(dataSection.content as Record<string, unknown>);
      }
    }

  } catch (error) {
    renderer.error("Failed to list goals", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}
