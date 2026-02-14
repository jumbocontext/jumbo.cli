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
import { GoalView } from "../../../../../application/context/goals/GoalView.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { GoalListOutputBuilder } from "./GoalListOutputBuilder.js";

/**
 * Valid goal statuses for filtering
 */
const VALID_STATUSES = ["to-do", "doing", "blocked", "paused", "refined", "in-review", "qualified", "done"] as const;

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
      flags: "--status <statuses>",
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
    // Fetch all goals
    const allGoals = await container.goalStatusReader.findAll();

    // Determine which statuses to filter for
    let statusesToFilter: string[];

    if (options.status) {
      // Parse comma-separated statuses
      const requestedStatuses = options.status.split(',').map(s => s.trim());

      // Validate all requested statuses
      const invalidStatuses = requestedStatuses.filter(s => !VALID_STATUSES.includes(s as typeof VALID_STATUSES[number]));
      if (invalidStatuses.length > 0) {
        renderer.error(
          "Invalid status values",
          new Error(`Invalid status: ${invalidStatuses.join(", ")}. Valid statuses: ${VALID_STATUSES.join(", ")}`)
        );
        process.exit(1);
      }

      statusesToFilter = requestedStatuses;
    } else {
      // Default: filter to non-completed goals
      statusesToFilter = ["to-do", "doing", "blocked", "paused", "refined", "in-review", "qualified"];
    }

    // Filter goals by requested statuses
    const filteredGoals = allGoals.filter((goal: GoalView) =>
      statusesToFilter.includes(goal.status)
    );

    // Build and render output using builder pattern
    const outputBuilder = new GoalListOutputBuilder();

    if (filteredGoals.length === 0) {
      const message = options.status
        ? `No goals found with status: ${statusesToFilter.join(", ")}`
        : "No active goals. All goals are completed.";
      const output = outputBuilder.buildNoGoalsFound(message);
      renderer.info(output.toHumanReadable());
      return;
    }

    // Preserve TTY vs pipe behavior: formatted text for humans, JSON for machines
    if (process.stdout.isTTY) {
      const output = outputBuilder.buildActiveGoalsList(filteredGoals);
      renderer.info(output.toHumanReadable());
    } else {
      const output = outputBuilder.buildStructuredOutput(filteredGoals);
      const sections = output.getSections();
      const dataSection = sections.find(s => s.type === 'data');
      if (dataSection) {
        renderer.data(dataSection.content as Record<string, unknown>);
      }
    }

  } catch (error) {
    const outputBuilder = new GoalListOutputBuilder();
    const output = outputBuilder.buildFailureError(error instanceof Error ? error : String(error));
    renderer.error("Failed to list goals", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
