/**
 * CLI Command: jumbo goal update
 *
 * Updates properties of an existing goal.
 * Only provided fields are updated; omitted fields remain unchanged.
 *
 * Usage:
 *   jumbo goal update --id <id> [--title "..."] [--objective "..."] [--criteria "..."] [--scope-in "..."] [--scope-out "..."]
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { UpdateGoalRequest } from "../../../../../application/context/goals/update/UpdateGoalRequest.js";
import { GoalUpdateOutputBuilder } from "./GoalUpdateOutputBuilder.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Update an existing goal's properties (partial updates supported)",
  category: "work",
  requiredOptions: [
    {
      flags: "-i, --id <id>",
      description: "ID of the goal to update"
    }
  ],
  options: [
    {
      flags: "-t, --title <text>",
      description: "Updated title (max 60 characters)"
    },
    {
      flags: "--objective <text>",
      description: "Updated objective"
    },
    {
      flags: "--criteria <items...>",
      description: "Updated success criteria (can specify multiple)"
    },
    {
      flags: "--scope-in <items...>",
      description: "Updated in-scope items"
    },
    {
      flags: "--scope-out <items...>",
      description: "Updated out-of-scope items"
    },
    {
      flags: "--next-goal <goalId>",
      description: "Update the NextGoal property (chains to specified goal after completion)"
    },
    {
      flags: "--prerequisite-goals <goalIds...>",
      description: "Update prerequisite goal IDs that must be completed before this goal can start"
    }
  ],
  examples: [
    {
      command: "jumbo goal update --id goal_abc123 --title \"New Title\"",
      description: "Update a goal's title only"
    },
    {
      command: "jumbo goal update --id goal_abc123 --objective \"Updated goal\"",
      description: "Update a goal's objective only"
    },
    {
      command: "jumbo goal update --id goal_abc123 --criteria \"Criterion 1\" --criteria \"Criterion 2\"",
      description: "Update success criteria only"
    },
    {
      command: "jumbo goal update --id goal_abc123 --objective \"New objective\" --scope-in \"Component A\"",
      description: "Update multiple fields at once"
    }
  ],
  related: ["goal add", "goal start", "goal complete"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalUpdate(
  options: {
    id: string;
    title?: string;
    objective?: string;
    criteria?: string[];
    scopeIn?: string[];
    scopeOut?: string[];
    nextGoal?: string;
    prerequisiteGoals?: string[];
  },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();
  const outputBuilder = new GoalUpdateOutputBuilder();

  try {
    const request: UpdateGoalRequest = {
      goalId: options.id,
      title: options.title,
      objective: options.objective,
      successCriteria: options.criteria,
      scopeIn: options.scopeIn,
      scopeOut: options.scopeOut,
      nextGoalId: options.nextGoal,
      prerequisiteGoals: options.prerequisiteGoals,
    };

    const response = await container.updateGoalController.handle(request);

    // Build and render success output
    const output = outputBuilder.buildSuccess(response.goalId);
    renderer.info(output.toHumanReadable());
  } catch (error) {
    const output = outputBuilder.buildFailureError(error instanceof Error ? error : String(error));
    renderer.info(output.toHumanReadable());
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
