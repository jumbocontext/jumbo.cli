/**
 * CLI Command: jumbo goal add
 *
 * Defines a new goal aggregate with 'to-do' status.
 *
 * Usage:
 *   jumbo goal add --title "..." --objective "..." --criteria "..." [--scope-in "..."] [--scope-out "..."]
 *   jumbo goal add --interactive  (guided creation with prompts)
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { AddGoalRequest } from "../../../../../application/context/goals/add/AddGoalRequest.js";
import { InteractivePromptService } from "../../../prompts/index.js";
import { ComponentView } from "../../../../../application/context/components/ComponentView.js";
import { GoalAddOutputBuilder } from "./GoalAddOutputBuilder.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Define a new goal with objective, criteria, and scope",
  category: "work",
  requiredOptions: [],
  options: [
    {
      flags: "--interactive",
      description: "Guided goal creation with interactive prompts"
    },
    {
      flags: "-t, --title <title>",
      description: "Short title for the goal (max 60 characters)"
    },
    {
      flags: "--objective <objective>",
      description: "The goal's objective or purpose (required unless --interactive)"
    },
    {
      flags: "--criteria <criteria...>",
      description: "Success criteria for the goal"
    },
    {
      flags: "--scope-in <components...>",
      description: "Components/modules in scope for this goal"
    },
    {
      flags: "--scope-out <components...>",
      description: "Components/modules explicitly out of scope"
    },
    {
      flags: "--next-goal <goalId>",
      description: "Set the NextGoal property on this new goal (chains to specified goal after completion)"
    },
    {
      flags: "--previous-goal <goalId>",
      description: "Updates the specified goal's NextGoal to point to this new goal (chains from specified goal)"
    },
    {
      flags: "--prerequisite-goals <goalIds...>",
      description: "Goal IDs that must be completed before this goal can start"
    }
  ],
  examples: [
    {
      command: "jumbo goal add --interactive",
      description: "Create a goal with guided prompts"
    },
    {
      command: "jumbo goal add --title \"JWT Auth\" --objective \"Implement JWT auth\" --criteria \"Token generation\" \"Token validation\"",
      description: "Add a goal with title and success criteria"
    },
    {
      command: "jumbo goal add --objective \"Refactor UserService\" --scope-in UserService AuthMiddleware --scope-out AdminRoutes",
      description: "Add a goal with scope defined"
    }
  ],
  related: ["goal start", "goal complete", "goal update"]
};

/**
 * Collected values from interactive prompts
 */
interface InteractiveGoalInputs {
  title: string;
  objective: string;
  successCriteria: string[];
  scopeIn: string[];
  scopeOut: string[];
}

/**
 * Runs interactive goal creation flow with prompts
 */
async function runInteractiveFlow(container: IApplicationContainer): Promise<InteractiveGoalInputs> {
  const promptService = new InteractivePromptService();

  // Fetch components for scope selection
  const components = await container.componentViewReader.findAll();
  const activeComponents = components.filter((c: ComponentView) => c.status === 'active');

  // Step 1: Title (required)
  const title = await promptService.textInput({
    message: "Goal title:",
    suffix: "  A short title for the goal (max 60 characters)",
    required: true,
  });

  // Step 2: Objective (required)
  const objective = await promptService.textInput({
    message: "Goal objective:",
    suffix: "  A clear, concise statement of what needs to be accomplished (1-2 sentences)",
    required: true,
  });

  // Step 3: Components in scope
  const scopeInResult = await promptService.selectEntities<ComponentView>(
    activeComponents,
    {
      message: "Select components IN SCOPE for this goal:",
      suffix: "  (Use space to select, enter to confirm. Skip if none apply)",
      formatter: (c) => `${c.name} - ${c.description}`,
      emptyMessage: "No components defined. Skipping scope selection.\n  (Add components with: jumbo component add)",
    }
  );

  // Step 4: Components out of scope (only if there are remaining components)
  const remainingComponents = activeComponents.filter(
    (c: ComponentView) => !scopeInResult.selected.some((s) => s.componentId === c.componentId)
  );

  const scopeOutResult = await promptService.selectEntities<ComponentView>(
    remainingComponents,
    {
      message: "Select components explicitly OUT OF SCOPE (optional):",
      suffix: "  (These will be excluded from the goal context)",
      formatter: (c) => `${c.name} - ${c.description}`,
    }
  );

  // Step 5: Success criteria
  const criteriaInput = await promptService.multiTextInput({
    message: "Success criteria (comma-separated):",
    suffix: "  Measurable outcomes that define when the goal is complete\n  Example: Tests pass, API returns 200, Documentation updated",
    minValues: 1,
  });

  // Transform selected entities to context format
  return {
    title: title!,
    objective: objective!,
    successCriteria: criteriaInput,
    scopeIn: scopeInResult.selected.map((c) => c.name),
    scopeOut: scopeOutResult.selected.map((c) => c.name),
  };
}

export async function goalAdd(
  options: {
    interactive?: boolean;
    title?: string;
    objective?: string;
    criteria?: string[];
    scopeIn?: string[];
    scopeOut?: string[];
    nextGoal?: string;
    previousGoal?: string;
    prerequisiteGoals?: string[];
  },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();
  const outputBuilder = new GoalAddOutputBuilder();

  try {
    // Interactive mode: run guided prompts
    if (options.interactive) {
      // Display interactive header
      const headerOutput = outputBuilder.buildInteractiveHeader();
      renderer.info(headerOutput.toHumanReadable());

      const inputs = await runInteractiveFlow(container);

      const request: AddGoalRequest = {
        title: inputs.title,
        objective: inputs.objective,
        successCriteria: inputs.successCriteria,
        scopeIn: inputs.scopeIn.length > 0 ? inputs.scopeIn : undefined,
        scopeOut: inputs.scopeOut.length > 0 ? inputs.scopeOut : undefined,
        nextGoalId: options.nextGoal,
        previousGoalId: options.previousGoal,
        prerequisiteGoals: options.prerequisiteGoals,
      };

      const response = await container.addGoalController.handle(request);

      // Build and render success output
      const output = outputBuilder.buildSuccess(response.goalId, inputs.title, inputs.objective);
      renderer.info(output.toHumanReadable());
      return;
    }

    // Non-interactive mode: objective is required
    if (!options.objective) {
      const output = outputBuilder.buildMissingObjectiveError();
      renderer.info(output.toHumanReadable());
      process.exit(1);
    }

    const request: AddGoalRequest = {
      title: options.title || '',
      objective: options.objective,
      successCriteria: options.criteria || [],
      scopeIn: options.scopeIn,
      scopeOut: options.scopeOut,
      nextGoalId: options.nextGoal,
      previousGoalId: options.previousGoal,
      prerequisiteGoals: options.prerequisiteGoals,
    };

    const response = await container.addGoalController.handle(request);

    // Build and render success output
    const output = outputBuilder.buildSuccess(response.goalId, options.title || '', options.objective);
    renderer.info(output.toHumanReadable());
  } catch (error) {
    const output = outputBuilder.buildFailureError(error instanceof Error ? error : String(error));
    renderer.info(output.toHumanReadable());
    process.exit(1);
  }
}
