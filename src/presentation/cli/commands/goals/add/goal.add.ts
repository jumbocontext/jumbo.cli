/**
 * CLI Command: jumbo goal add
 *
 * Defines a new goal aggregate with 'to-do' status.
 *
 * Usage:
 *   jumbo goal add --objective "..." --criteria "..." [--scope-in "..."] [--scope-out "..."] [--boundary "..."]
 *   jumbo goal add --interactive  (guided creation with prompts)
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { AddGoalCommandHandler } from "../../../../../application/goals/add/AddGoalCommandHandler.js";
import { AddGoalCommand } from "../../../../../application/goals/add/AddGoalCommand.js";
import { InteractivePromptService } from "../../../prompts/index.js";
import { ComponentView } from "../../../../../application/components/ComponentView.js";
import { InvariantView } from "../../../../../application/invariants/InvariantView.js";
import { GuidelineView } from "../../../../../application/guidelines/GuidelineView.js";
import { DecisionView } from "../../../../../application/decisions/DecisionView.js";
import { DependencyView } from "../../../../../application/dependencies/DependencyView.js";
import { ArchitectureView } from "../../../../../application/architecture/ArchitectureView.js";
import {
  EmbeddedDependency,
  EmbeddedArchitecture,
} from "../../../../../domain/goals/EmbeddedContextTypes.js";

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
      flags: "--boundary <boundaries...>",
      description: "Non-negotiable constraints or boundaries"
    },
    {
      flags: "--relevant-invariants <json>",
      description: "JSON array of relevant invariants [{title, description, rationale?}]"
    },
    {
      flags: "--relevant-guidelines <json>",
      description: "JSON array of relevant guidelines [{title, description, rationale?, examples?}]"
    },
    {
      flags: "--relevant-components <json>",
      description: "JSON array of relevant components [{name, responsibility}]"
    },
    {
      flags: "--relevant-dependencies <json>",
      description: "JSON array of relevant dependencies [{consumer, provider}]"
    },
    {
      flags: "--architecture <json>",
      description: "JSON object for architecture {description, organization, patterns?, principles?}"
    },
    {
      flags: "--files-to-create <files...>",
      description: "New files this goal will create"
    },
    {
      flags: "--files-to-change <files...>",
      description: "Existing files this goal will modify"
    },
    {
      flags: "--next-goal <goalId>",
      description: "Set the NextGoal property on this new goal (chains to specified goal after completion)"
    },
    {
      flags: "--previous-goal <goalId>",
      description: "Updates the specified goal's NextGoal to point to this new goal (chains from specified goal)"
    }
  ],
  examples: [
    {
      command: "jumbo goal add --interactive",
      description: "Create a goal with guided prompts"
    },
    {
      command: "jumbo goal add --objective \"Implement JWT auth\" --criteria \"Token generation\" \"Token validation\"",
      description: "Add a goal with success criteria"
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
  objective: string;
  successCriteria: string[];
  scopeIn: string[];
  scopeOut: string[];
  boundaries: string[];
  relevantInvariants: Array<{ title: string; description: string; rationale?: string }>;
  relevantGuidelines: Array<{ title: string; description: string; rationale?: string; examples?: string[] }>;
  relevantComponents: Array<{ name: string; responsibility: string }>;
  relevantDependencies: EmbeddedDependency[];
  architecture: EmbeddedArchitecture | undefined;
  filesToCreate: string[];
  filesToChange: string[];
}

/**
 * Runs interactive goal creation flow with prompts
 */
async function runInteractiveFlow(container: IApplicationContainer): Promise<InteractiveGoalInputs> {
  const promptService = new InteractivePromptService();

  // Fetch all entities in parallel
  const [components, guidelines, invariants, decisions, dependencies, solutionContext] = await Promise.all([
    container.componentContextReader.findAll(),
    container.guidelineContextReader.findAll(),
    container.invariantContextReader.findAll(),
    container.decisionContextReader.findAllActive(),
    container.dependencyContextReader.findAll(),
    container.solutionContextReader.getSolutionContext(),
  ]);

  const activeComponents = components.filter((c: ComponentView) => c.status === 'active');
  const activeGuidelines = guidelines.filter((g: GuidelineView) => !g.isRemoved);
  const activeDependencies = dependencies.filter((d: DependencyView) => d.status === 'active');
  const architecture = solutionContext.architecture;

  // Build component name lookup for dependencies
  const componentNameById = new Map<string, string>();
  activeComponents.forEach((c: ComponentView) => componentNameById.set(c.componentId, c.name));

  console.log("\n=== Interactive Goal Creation ===\n");

  // Step 1: Objective (required)
  const objective = await promptService.textInput({
    message: "Goal objective:",
    suffix: "  A clear, concise statement of what needs to be accomplished (1-2 sentences)",
    required: true,
  });

  // Step 2: Components in scope
  const scopeInResult = await promptService.selectEntities<ComponentView>(
    activeComponents,
    {
      message: "Select components IN SCOPE for this goal:",
      suffix: "  (Use space to select, enter to confirm. Skip if none apply)",
      formatter: (c) => `${c.name} - ${c.description}`,
      emptyMessage: "No components defined. Skipping scope selection.\n  (Add components with: jumbo component add)",
    }
  );

  // Step 3: Components out of scope (only if there are remaining components)
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

  // Step 4: Relevant invariants
  const invariantsResult = await promptService.selectEntities<InvariantView>(
    invariants,
    {
      message: "Select relevant invariants:",
      suffix: "  (Non-negotiable constraints that must be maintained)",
      formatter: (inv) => `${inv.title} - ${inv.description}`,
      emptyMessage: "No invariants defined. Skipping.\n  (Add invariants with: jumbo invariant add)",
    }
  );

  // Step 5: Relevant guidelines
  const guidelinesResult = await promptService.selectEntities<GuidelineView>(
    activeGuidelines,
    {
      message: "Select relevant guidelines:",
      suffix: "  (Coding standards and practices to follow)",
      formatter: (g) => `[${g.category}] ${g.title} - ${g.description}`,
      emptyMessage: "No guidelines defined. Skipping.\n  (Add guidelines with: jumbo guideline add)",
    }
  );

  // Step 6: Relevant dependencies
  const dependenciesResult = await promptService.selectEntities<DependencyView>(
    activeDependencies,
    {
      message: "Select relevant dependencies:",
      suffix: "  (Component relationships that apply to this goal)",
      formatter: (d) => {
        const consumer = componentNameById.get(d.consumerId) || d.consumerId;
        const provider = componentNameById.get(d.providerId) || d.providerId;
        return `${consumer} → ${provider}${d.endpoint ? ` (${d.endpoint})` : ''}`;
      },
      emptyMessage: "No dependencies defined. Skipping.\n  (Add dependencies with: jumbo dependency add)",
    }
  );

  // Step 7: Display architecture for awareness and confirm inclusion
  let includeArchitecture = false;
  if (architecture) {
    promptService.displayInfo(
      "Current Architecture:",
      [architecture],
      (a: ArchitectureView) => `${a.description} (${a.organization})`
    );
    const includeArch = await promptService.textInput({
      message: "Include architecture in goal context? (y/n):",
      suffix: "  Enter 'y' to embed architecture details in this goal",
    });
    includeArchitecture = includeArch?.toLowerCase() === 'y';
  }

  // Step 8: Display decisions for awareness (no selection)
  if (decisions.length > 0) {
    promptService.displayInfo(
      "Active Decisions (for your awareness):",
      decisions,
      (d: DecisionView) => `${d.title} - ${d.context}`
    );
  }

  // Step 9: Success criteria
  const criteriaInput = await promptService.multiTextInput({
    message: "Success criteria (comma-separated):",
    suffix: "  Measurable outcomes that define when the goal is complete\n  Example: Tests pass, API returns 200, Documentation updated",
    minValues: 1,
  });

  // Step 10: Boundaries (optional)
  const boundariesInput = await promptService.multiTextInput({
    message: "Boundaries (comma-separated, optional):",
    suffix: "  Non-negotiable constraints specific to this goal\n  Example: Must not break existing API, No new dependencies",
  });

  // Step 11: Files to create (optional)
  const filesToCreateInput = await promptService.multiTextInput({
    message: "Files to create (comma-separated, optional):",
    suffix: "  New files this goal will add\n  Example: src/auth/JwtService.ts, src/middleware/Auth.ts",
  });

  // Step 12: Files to change (optional)
  const filesToChangeInput = await promptService.multiTextInput({
    message: "Files to change (comma-separated, optional):",
    suffix: "  Existing files this goal will modify\n  Example: src/routes/api.ts, src/config/app.ts",
  });

  // Transform selected entities to embedded context format
  return {
    objective: objective!,
    successCriteria: criteriaInput,
    scopeIn: scopeInResult.selected.map((c) => c.name),
    scopeOut: scopeOutResult.selected.map((c) => c.name),
    boundaries: boundariesInput,
    relevantInvariants: invariantsResult.selected.map((inv) => ({
      title: inv.title,
      description: inv.description,
      rationale: inv.rationale || undefined,
    })),
    relevantGuidelines: guidelinesResult.selected.map((g) => ({
      title: g.title,
      description: g.description,
      rationale: g.rationale || undefined,
      examples: g.examples.length > 0 ? g.examples : undefined,
    })),
    relevantComponents: scopeInResult.selected.map((c) => ({
      name: c.name,
      responsibility: c.responsibility,
    })),
    relevantDependencies: dependenciesResult.selected.map((d) => ({
      consumer: componentNameById.get(d.consumerId) || d.consumerId,
      provider: componentNameById.get(d.providerId) || d.providerId,
    })),
    architecture: includeArchitecture && architecture ? {
      description: architecture.description,
      organization: architecture.organization,
      patterns: architecture.patterns.length > 0 ? architecture.patterns : undefined,
      principles: architecture.principles.length > 0 ? architecture.principles : undefined,
    } : undefined,
    filesToCreate: filesToCreateInput,
    filesToChange: filesToChangeInput,
  };
}

export async function goalAdd(
  options: {
    interactive?: boolean;
    objective?: string;
    criteria?: string[];
    scopeIn?: string[];
    scopeOut?: string[];
    boundary?: string[];
    relevantInvariants?: string;
    relevantGuidelines?: string;
    relevantComponents?: string;
    relevantDependencies?: string;
    architecture?: string;
    filesToCreate?: string[];
    filesToChange?: string[];
    nextGoal?: string;
    previousGoal?: string;
  },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();

  try {
    // Interactive mode: run guided prompts
    if (options.interactive) {
      const inputs = await runInteractiveFlow(container);

      // Create command handler with optional update dependencies for goal chaining
      const commandHandler = new AddGoalCommandHandler(
        container.goalAddedEventStore,
        container.eventBus,
        options.previousGoal ? container.goalUpdatedEventStore : undefined,
        options.previousGoal ? container.goalUpdatedEventStore : undefined,
        options.previousGoal ? container.goalUpdatedProjector : undefined
      );

      // Execute command with collected inputs
      const command: AddGoalCommand = {
        objective: inputs.objective,
        successCriteria: inputs.successCriteria,
        scopeIn: inputs.scopeIn.length > 0 ? inputs.scopeIn : undefined,
        scopeOut: inputs.scopeOut.length > 0 ? inputs.scopeOut : undefined,
        boundaries: inputs.boundaries.length > 0 ? inputs.boundaries : undefined,
        relevantInvariants: inputs.relevantInvariants.length > 0 ? inputs.relevantInvariants : undefined,
        relevantGuidelines: inputs.relevantGuidelines.length > 0 ? inputs.relevantGuidelines : undefined,
        relevantComponents: inputs.relevantComponents.length > 0 ? inputs.relevantComponents : undefined,
        relevantDependencies: inputs.relevantDependencies.length > 0 ? inputs.relevantDependencies : undefined,
        architecture: inputs.architecture,
        filesToBeCreated: inputs.filesToCreate.length > 0 ? inputs.filesToCreate : undefined,
        filesToBeChanged: inputs.filesToChange.length > 0 ? inputs.filesToChange : undefined,
        nextGoalId: options.nextGoal,
        previousGoalId: options.previousGoal,
      };

      const result = await commandHandler.execute(command);

      // Success output
      renderer.success("Goal defined", {
        goalId: result.goalId,
        objective: inputs.objective,
        status: "to-do"
      });
      return;
    }

    // Non-interactive mode: objective is required
    if (!options.objective) {
      renderer.error("Missing required option", new Error("--objective is required (or use --interactive for guided creation)"));
      process.exit(1);
    }

    // JSON parsing helper
    const parseJson = (jsonStr: string | undefined, fieldName: string) => {
      if (!jsonStr) return undefined;
      try {
        return JSON.parse(jsonStr);
      } catch {
        throw new Error(`Invalid JSON for ${fieldName}: ${jsonStr}`);
      }
    };

    // Create command handler with optional update dependencies for goal chaining
    const commandHandler = new AddGoalCommandHandler(
      container.goalAddedEventStore,
      container.eventBus,
      options.previousGoal ? container.goalUpdatedEventStore : undefined,
      options.previousGoal ? container.goalUpdatedEventStore : undefined,
      options.previousGoal ? container.goalUpdatedProjector : undefined
    );

    // Execute command (handler generates goalId)
    const command: AddGoalCommand = {
      objective: options.objective,
      successCriteria: options.criteria || [],
      scopeIn: options.scopeIn,
      scopeOut: options.scopeOut,
      boundaries: options.boundary,
      relevantInvariants: parseJson(options.relevantInvariants, "relevant-invariants"),
      relevantGuidelines: parseJson(options.relevantGuidelines, "relevant-guidelines"),
      relevantComponents: parseJson(options.relevantComponents, "relevant-components"),
      relevantDependencies: parseJson(options.relevantDependencies, "relevant-dependencies"),
      architecture: parseJson(options.architecture, "architecture"),
      filesToBeCreated: options.filesToCreate,
      filesToBeChanged: options.filesToChange,
      nextGoalId: options.nextGoal,
      previousGoalId: options.previousGoal,
    };

    const result = await commandHandler.execute(command);

    // Success output
    renderer.success("Goal defined", {
      goalId: result.goalId,
      objective: options.objective,
      status: "to-do"
    });
  } catch (error) {
    renderer.error("Failed to define goal", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}
