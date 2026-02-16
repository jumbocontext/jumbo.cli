/**
 * CLI Command: jumbo goal refine
 *
 * Refines a goal (transitions status from 'to-do' to 'refined').
 * Goals must be refined before they can be started.
 *
 * In interactive mode, prompts to register relations with components,
 * dependencies, and other entities.
 */

import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { RefineGoalCommandHandler } from "../../../../../application/context/goals/refine/RefineGoalCommandHandler.js";
import { RefineGoalCommand } from "../../../../../application/context/goals/refine/RefineGoalCommand.js";
import { AddRelationCommandHandler } from "../../../../../application/context/relations/add/AddRelationCommandHandler.js";
import { AddRelationCommand } from "../../../../../application/context/relations/add/AddRelationCommand.js";
import { InteractivePromptService } from "../../../prompts/index.js";
import { ComponentView } from "../../../../../application/context/components/ComponentView.js";
import { InvariantView } from "../../../../../application/context/invariants/InvariantView.js";
import { GuidelineView } from "../../../../../application/context/guidelines/GuidelineView.js";
import { DecisionView } from "../../../../../application/context/decisions/DecisionView.js";
import { EntityType, EntityTypeValue, RelationStrengthValue } from "../../../../../domain/relations/Constants.js";
import { GoalRefineOutputBuilder } from "./GoalRefineOutputBuilder.js";
import { ContextualGoalView } from "../../../../../application/context/goals/get/ContextualGoalView.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Refine a goal by displaying details and prompting for approval before transitioning to 'refined' status",
  category: "work",
  requiredOptions: [
    {
      flags: "--goal-id <goalId>",
      description: "ID of the goal to refine"
    }
  ],
  options: [
    {
      flags: "--interactive",
      description: "Guided refinement with prompts to register relations"
    },
    {
      flags: "--approve",
      description: "Approve the goal refinement without interactive prompts"
    }
  ],
  examples: [
    {
      command: "jumbo goal refine --goal-id goal_abc123",
      description: "Display goal details for review (interactive mode)"
    },
    {
      command: "jumbo goal refine --goal-id goal_abc123 --approve",
      description: "Approve and refine the goal without prompts"
    },
    {
      command: "jumbo goal refine --goal-id goal_abc123 --interactive",
      description: "Refine with interactive prompts to register relations"
    }
  ],
  related: ["goal add", "goal start", "relation add"]
};

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function goalRefine(
  options: {
    goalId: string;
    interactive?: boolean;
    approve?: boolean;
  },
  container: IApplicationContainer
) {
  const renderer = Renderer.getInstance();
  const outputBuilder = new GoalRefineOutputBuilder();

  try {
    // 1. Verify goal exists and is in to-do status
    const goalView = await container.goalContextReader.findById(options.goalId);
    if (!goalView) {
      const output = outputBuilder.buildGoalNotFoundError(options.goalId);
      renderer.error(output.toHumanReadable());
      process.exit(1);
    }

    // 2. Branch based on mode
    if (options.interactive) {
      // Interactive mode: renderGoalDetails + runInteractiveRelationFlow + approveGoal
      const detailsOutput = outputBuilder.buildGoalDetailsAndRefinementPrompt(goalView);
      renderer.info(detailsOutput.toHumanReadable());

      const createdRelations = await runInteractiveRelationFlow(options.goalId, container);

      // Display relations if any were created
      if (createdRelations.length > 0) {
        const relationsOutput = outputBuilder.buildCreatedRelations(createdRelations);
        renderer.info(relationsOutput.toHumanReadable());
      }

      const goalContextView = await approveGoal(options.goalId, container);
      const successOutput = outputBuilder.buildSuccess(goalContextView.goal.goalId, goalContextView.goal.status);
      renderer.info(successOutput.toHumanReadable());
    } else if (options.approve) {
      // Approve mode: renderGoalDetails + renderLlmRefinementPrompt + approveGoal
      const detailsOutput = outputBuilder.buildGoalDetailsAndRefinementPrompt(goalView);
      renderer.info(detailsOutput.toHumanReadable());

      const goalContextView = await approveGoal(options.goalId, container);
      const successOutput = outputBuilder.buildSuccess(goalContextView.goal.goalId, goalContextView.goal.status);
      renderer.info(successOutput.toHumanReadable());
    } else {
      // Default mode: renderGoalDetails + renderLlmRefinementPrompt + show approval instruction (no status change)
      const detailsOutput = outputBuilder.buildGoalDetailsAndRefinementPrompt(goalView);
      renderer.info(detailsOutput.toHumanReadable());

      // Show approval instruction
      const approvalOutput = outputBuilder.buildApprovalInstruction(options.goalId);
      renderer.info(approvalOutput.toHumanReadable());
    }

  } catch (error) {
    const errorOutput = outputBuilder.buildFailureError(error instanceof Error ? error : String(error));
    renderer.error(errorOutput.toHumanReadable());
    process.exit(1);
  }
}

/**
 * Runs interactive flow to register relations for the goal
 */
async function runInteractiveRelationFlow(
  goalId: string,
  container: IApplicationContainer
): Promise<Array<{ relationId: string; toType: string; toId: string; relationType: string }>> {
  const promptService = new InteractivePromptService();
  const createdRelations: Array<{ relationId: string; toType: string; toId: string; relationType: string }> = [];

  // Fetch all entities in parallel
  const [components, guidelines, invariants, decisions] = await Promise.all([
    container.componentViewReader.findAll(),
    container.guidelineViewReader.findAll(),
    container.invariantViewReader.findAll(),
    container.decisionViewReader.findAll("active"),
  ]);

  const activeComponents = components.filter((c: ComponentView) => c.status === 'active');
  const activeGuidelines = guidelines.filter((g: GuidelineView) => !g.isRemoved);

  console.log("\n=== Goal Refinement: Register Relations ===\n");
  console.log("Select entities that this goal relates to.");
  console.log("Relations help track what components, decisions, and invariants are involved.\n");

  // Step 1: Select related components
  const componentResult = await promptService.selectEntities<ComponentView>(
    activeComponents,
    {
      message: "Select components this goal involves:",
      suffix: "  (Use space to select, enter to confirm. Skip if none apply)",
      formatter: (c) => `${c.name} - ${c.description}`,
      emptyMessage: "No components defined. Skipping.\n  (Add components with: jumbo component add)",
    }
  );

  // Create relations for selected components
  for (const component of componentResult.selected) {
    const relationType = await promptService.textInput({
      message: `Relation type for ${component.name}:`,
      suffix: "  e.g., involves, modifies, creates, uses",
      required: true,
    });

    const description = await promptService.textInput({
      message: `Description for relation to ${component.name}:`,
      suffix: "  Brief explanation of how this goal relates to the component",
      required: true,
    });

    const relation = await createRelation(
      goalId,
      EntityType.COMPONENT,
      component.componentId,
      relationType!,
      description!,
      container
    );
    createdRelations.push({
      relationId: relation.relationId,
      toType: EntityType.COMPONENT,
      toId: component.componentId,
      relationType: relationType!,
    });
  }

  // Step 2: Select related invariants
  const invariantResult = await promptService.selectEntities<InvariantView>(
    invariants,
    {
      message: "Select invariants this goal must respect:",
      suffix: "  (Non-negotiable constraints that apply to this goal)",
      formatter: (inv) => `${inv.title} - ${inv.description}`,
      emptyMessage: "No invariants defined. Skipping.\n  (Add invariants with: jumbo invariant add)",
    }
  );

  // Create relations for selected invariants
  for (const invariant of invariantResult.selected) {
    const relation = await createRelation(
      goalId,
      EntityType.INVARIANT,
      invariant.invariantId,
      "must-respect",
      `Goal must respect invariant: ${invariant.title}`,
      container
    );
    createdRelations.push({
      relationId: relation.relationId,
      toType: EntityType.INVARIANT,
      toId: invariant.invariantId,
      relationType: "must-respect",
    });
  }

  // Step 3: Select related guidelines
  const guidelineResult = await promptService.selectEntities<GuidelineView>(
    activeGuidelines,
    {
      message: "Select guidelines this goal should follow:",
      suffix: "  (Coding standards and practices to follow)",
      formatter: (g) => `[${g.category}] ${g.title} - ${g.description}`,
      emptyMessage: "No guidelines defined. Skipping.\n  (Add guidelines with: jumbo guideline add)",
    }
  );

  // Create relations for selected guidelines
  for (const guideline of guidelineResult.selected) {
    const relation = await createRelation(
      goalId,
      EntityType.GUIDELINE,
      guideline.guidelineId,
      "follows",
      `Goal follows guideline: ${guideline.title}`,
      container
    );
    createdRelations.push({
      relationId: relation.relationId,
      toType: EntityType.GUIDELINE,
      toId: guideline.guidelineId,
      relationType: "follows",
    });
  }

  // Step 4: Display decisions for awareness
  if (decisions.length > 0) {
    promptService.displayInfo(
      "Active Decisions (for your awareness):",
      decisions,
      (d: DecisionView) => `${d.title} - ${d.context}`
    );

    const linkDecisions = await promptService.textInput({
      message: "Link any decisions to this goal? (y/n):",
      suffix: "  Enter 'y' to select decisions to relate",
    });

    if (linkDecisions?.toLowerCase() === 'y') {
      const decisionResult = await promptService.selectEntities<DecisionView>(
        decisions,
        {
          message: "Select decisions this goal relates to:",
          formatter: (d) => `${d.title} - ${d.context}`,
        }
      );

      for (const decision of decisionResult.selected) {
        const relation = await createRelation(
          goalId,
          EntityType.DECISION,
          decision.decisionId,
          "implements",
          `Goal implements decision: ${decision.title}`,
          container
        );
        createdRelations.push({
          relationId: relation.relationId,
          toType: EntityType.DECISION,
          toId: decision.decisionId,
          relationType: "implements",
        });
      }
    }
  }

  return createdRelations;
}

/**
 * Approves goal refinement by transitioning status from 'to-do' to 'refined'.
 * Uses RefineGoalCommandHandler to persist the state change via event sourcing.
 * Returns enriched goal context view for presentation layer.
 */
async function approveGoal(
  goalId: string,
  container: IApplicationContainer
): Promise<ContextualGoalView> {
  // Create command handler
  const refineHandler = new RefineGoalCommandHandler(
    container.goalRefinedEventStore,
    container.goalRefinedEventStore,
    container.goalRefinedProjector,
    container.eventBus,
    container.goalContextQueryHandler
  );

  const refineCommand: RefineGoalCommand = { goalId };
  const goalContextView = await refineHandler.execute(refineCommand);

  return goalContextView;
}

/**
 * Creates a single relation from goal to target entity
 */
async function createRelation(
  goalId: string,
  toType: EntityTypeValue,
  toId: string,
  relationType: string,
  description: string,
  container: IApplicationContainer,
  strength?: RelationStrengthValue
): Promise<{ relationId: string }> {
  const handler = new AddRelationCommandHandler(
    container.relationAddedEventStore,
    container.eventBus,
    container.relationAddedProjector
  );

  const command: AddRelationCommand = {
    fromEntityType: EntityType.GOAL,
    fromEntityId: goalId,
    toEntityType: toType,
    toEntityId: toId,
    relationType,
    description,
    strength,
  };

  return handler.execute(command);
}

