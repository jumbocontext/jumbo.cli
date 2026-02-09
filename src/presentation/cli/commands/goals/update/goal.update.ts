/**
 * CLI Command: jumbo goal update
 *
 * Updates properties of an existing goal.
 * Only provided fields are updated; omitted fields remain unchanged.
 *
 * Usage:
 *   jumbo goal update <goalId> [--objective "..."] [--criteria "..."] [--scope-in "..."] [--scope-out "..."]
 *
 * Context fields (JSON format - typically used programmatically):
 *   --relevant-invariants <json>
 *   --relevant-guidelines <json>
 *   --relevant-dependencies <json>
 *   --relevant-components <json>
 *   --architecture <json>
 *   --files-to-be-created <items...>
 *   --files-to-be-changed <items...>
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { UpdateGoalCommandHandler } from "../../../../../application/goals/update/UpdateGoalCommandHandler.js";
import { UpdateGoalCommand } from "../../../../../application/goals/update/UpdateGoalCommand.js";

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
      flags: "--relevant-invariants <json>",
      description: "Relevant invariants (JSON array)"
    },
    {
      flags: "--relevant-guidelines <json>",
      description: "Relevant guidelines (JSON array)"
    },
    {
      flags: "--relevant-dependencies <json>",
      description: "Relevant dependencies (JSON array)"
    },
    {
      flags: "--relevant-components <json>",
      description: "Relevant components (JSON array)"
    },
    {
      flags: "--architecture <json>",
      description: "Architecture context (JSON object)"
    },
    {
      flags: "--files-to-be-created <items...>",
      description: "Files to be created"
    },
    {
      flags: "--files-to-be-changed <items...>",
      description: "Files to be changed"
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
    // Context fields (JSON strings from CLI)
    relevantInvariants?: string;
    relevantGuidelines?: string;
    relevantDependencies?: string;
    relevantComponents?: string;
    architecture?: string;
    filesToBeCreated?: string[];
    filesToBeChanged?: string[];
    nextGoal?: string;
  },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    // 1. Create command handler
    const commandHandler = new UpdateGoalCommandHandler(
      container.goalUpdatedEventStore,
      container.goalUpdatedEventStore,
      container.goalUpdatedProjector,
      container.eventBus
    );

    // 2. Parse JSON fields if provided
    const parseJson = (jsonStr: string | undefined, fieldName: string) => {
      if (!jsonStr) return undefined;
      try {
        return JSON.parse(jsonStr);
      } catch {
        throw new Error(`Invalid JSON for ${fieldName}: ${jsonStr}`);
      }
    };

    // 3. Build and execute command
    const command: UpdateGoalCommand = {
      goalId: options.goalId,
      objective: options.objective,
      successCriteria: options.criteria,
      scopeIn: options.scopeIn,
      scopeOut: options.scopeOut,
      // Context fields
      relevantInvariants: parseJson(options.relevantInvariants, "relevant-invariants"),
      relevantGuidelines: parseJson(options.relevantGuidelines, "relevant-guidelines"),
      relevantDependencies: parseJson(options.relevantDependencies, "relevant-dependencies"),
      relevantComponents: parseJson(options.relevantComponents, "relevant-components"),
      architecture: parseJson(options.architecture, "architecture"),
      filesToBeCreated: options.filesToBeCreated,
      filesToBeChanged: options.filesToBeChanged,
      nextGoalId: options.nextGoal,
    };

    const result = await commandHandler.execute(command);

    // Success output
    renderer.success("Goal updated", {
      goalId: result.goalId
    });
  } catch (error) {
    renderer.error("Failed to update goal", error instanceof Error ? error : String(error));
    process.exit(1);
  }
  // NO CLEANUP - infrastructure manages itself!
}
