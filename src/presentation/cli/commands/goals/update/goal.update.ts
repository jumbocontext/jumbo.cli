/**
 * CLI Command: jumbo goal update
 *
 * Updates properties of an existing goal.
 * Only provided fields are updated; omitted fields remain unchanged.
 *
 * Usage:
 *   jumbo goal update --goal-id <goalId> [--objective "..."] [--criteria "..."] [--scope-in "..."] [--scope-out "..."]
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { UpdateGoalCommandHandler } from "../../../../../application/context/goals/update/UpdateGoalCommandHandler.js";
import { UpdateGoalCommand } from "../../../../../application/context/goals/update/UpdateGoalCommand.js";
import { GoalUpdateOutputBuilder } from "./GoalUpdateOutputBuilder.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Update an existing goal's properties (partial updates supported)",
  category: "work",
  requiredOptions: [
    {
      flags: "--goal-id <goalId>",
      description: "ID of the goal to update"
    }
  ],
  options: [
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
    }
  ],
  examples: [
    {
      command: "jumbo goal update --goal-id goal_abc123 --objective \"Updated goal\"",
      description: "Update a goal's objective only"
    },
    {
      command: "jumbo goal update --goal-id goal_abc123 --criteria \"Criterion 1\" --criteria \"Criterion 2\"",
      description: "Update success criteria only"
    },
    {
      command: "jumbo goal update --goal-id goal_abc123 --objective \"New objective\" --scope-in \"Component A\"",
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
    goalId: string;
    objective?: string;
    criteria?: string[];
    scopeIn?: string[];
    scopeOut?: string[];
    nextGoal?: string;
  },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();
  const outputBuilder = new GoalUpdateOutputBuilder();

  try {
    // 1. Create command handler
    const commandHandler = new UpdateGoalCommandHandler(
      container.goalUpdatedEventStore,
      container.goalUpdatedEventStore,
      container.goalUpdatedProjector,
      container.eventBus
    );

    // 2. Build and execute command
    const command: UpdateGoalCommand = {
      goalId: options.goalId,
      objective: options.objective,
      successCriteria: options.criteria,
      scopeIn: options.scopeIn,
      scopeOut: options.scopeOut,
      nextGoalId: options.nextGoal,
    };

    const result = await commandHandler.execute(command);

    // Build and render success output
    const output = outputBuilder.buildSuccess(result.goalId);
    renderer.info(output.toHumanReadable());
  } catch (error) {
    const output = outputBuilder.buildFailureError(error instanceof Error ? error : String(error));
    renderer.info(output.toHumanReadable());
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
