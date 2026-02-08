/**
 * CLI Command: jumbo goals list
 *
 * Lists non-completed goals (to-do, doing, blocked).
 * This is an undocumented command for human oversight.
 *
 * Usage:
 *   jumbo goals list
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { GoalView } from "../../../../../application/goals/GoalView.js";

/**
 * Command metadata for auto-registration
 * Hidden: true - This command is intentionally not shown in --help
 */
export const metadata: CommandMetadata = {
  description: "List non-completed goals (to-do, doing, blocked, paused)",
  category: "work",
  hidden: true,
  examples: [
    {
      command: "jumbo goals list",
      description: "List all active goals"
    }
  ]
};

/**
 * Format status with visual indicator
 */
function formatStatus(status: string): string {
  switch (status) {
    case "doing":
      return "[DOING]  ";
    case "blocked":
      return "[BLOCKED]";
    case "to-do":
      return "[TO-DO]  ";
    case "paused":
      return "[PAUSED] ";
    default:
      return `[${status.toUpperCase()}]`;
  }
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalsList(
  _options: Record<string, never>,
  container: IApplicationContainer
) {
  try {
    // Fetch all goals
    const allGoals = await container.goalStatusReader.findAll();

    // Filter to non-completed goals (to-do, doing, blocked, paused)
    const nonCompletedStatuses = ["to-do", "doing", "blocked", "paused"];
    const activeGoals = allGoals.filter((goal: GoalView) =>
      nonCompletedStatuses.includes(goal.status)
    );

    if (activeGoals.length === 0) {
      console.log("No active goals. All goals are completed.");
      return;
    }

    // Sort: first paused, then doing, then blocked, then to-do, then paused, then by createdAt
    const statusOrder: Record<string, number> = {
      "paused": 0,
      "doing": 1,
      "blocked": 2,
      "to-do": 3
    };

    activeGoals.sort((a: GoalView, b: GoalView) => {
      const statusDiff = (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
      if (statusDiff !== 0) return statusDiff;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    // Output header
    console.log(`\nActive Goals (${activeGoals.length}):\n`);

    // Output each goal as a readable line
    for (const goal of activeGoals) {
      const status = formatStatus(goal.status);
      console.log(`${status}  ${goal.goalId}`);
      console.log(`           ${goal.objective}`);
      if (goal.note) {
        console.log(`           Note: ${goal.note}`);
      }
      console.log("");
    }
  } catch (error) {
    console.error("Failed to list goals:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
