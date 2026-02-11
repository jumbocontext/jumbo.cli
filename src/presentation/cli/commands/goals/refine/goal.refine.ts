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
import { RefineGoalCommandHandler } from "../../../../../application/goals/refine/RefineGoalCommandHandler.js";
import { RefineGoalCommand } from "../../../../../application/goals/refine/RefineGoalCommand.js";
import { AddRelationCommandHandler } from "../../../../../application/relations/add/AddRelationCommandHandler.js";
import { AddRelationCommand } from "../../../../../application/relations/add/AddRelationCommand.js";
import { InteractivePromptService } from "../../../prompts/index.js";
import { ComponentView } from "../../../../../application/components/ComponentView.js";
import { InvariantView } from "../../../../../application/invariants/InvariantView.js";
import { GuidelineView } from "../../../../../application/guidelines/GuidelineView.js";
import { DecisionView } from "../../../../../application/decisions/DecisionView.js";
import { EntityType, EntityTypeValue, RelationStrengthValue } from "../../../../../domain/relations/Constants.js";
import { GoalView } from "../../../../../application/goals/GoalView.js";

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

  try {
    // 1. Verify goal exists and is in to-do status
    const goalView = await container.goalContextReader.findById(options.goalId);
    if (!goalView) {
      renderer.error("Goal not found", `No goal exists with ID: ${options.goalId}`);
      process.exit(1);
    }

    // 2. Branch based on mode
    if (options.interactive) {
      // Interactive mode: renderGoalDetails + runInteractiveRelationFlow + approveGoal
      renderGoalDetails(goalView, renderer);
      const createdRelations = await runInteractiveRelationFlow(options.goalId, container, renderer);

      // Display relations if any were created
      if (createdRelations.length > 0) {
        renderer.info("\nRelations registered:");
        createdRelations.forEach((rel) => {
          renderer.info(`  - ${rel.relationType} → ${rel.toType}:${rel.toId}`);
        });
      }

      await approveGoal(options.goalId, container, renderer);
    } else if (options.approve) {
      // Approve mode: renderGoalDetails + renderLlmRefinementPrompt + approveGoal
      renderGoalDetails(goalView, renderer);
      renderLlmRefinementPrompt(options.goalId, renderer);
      await approveGoal(options.goalId, container, renderer);
    } else {
      // Default mode: renderGoalDetails + renderLlmRefinementPrompt + show approval instruction (no status change)
      renderGoalDetails(goalView, renderer);
      renderLlmRefinementPrompt(options.goalId, renderer);

      // Show approval instruction
      renderer.info("\n@LLM: Review goal details above. When ready to approve refinement, run:");
      renderer.info(`  jumbo goal refine --goal-id ${options.goalId} --approve`);
    }

  } catch (error) {
    renderer.error("Failed to refine goal", error instanceof Error ? error : String(error));
    process.exit(1);
  }
}

/**
 * Runs interactive flow to register relations for the goal
 */
async function runInteractiveRelationFlow(
  goalId: string,
  container: IApplicationContainer,
  renderer: Renderer
): Promise<Array<{ relationId: string; toType: string; toId: string; relationType: string }>> {
  const promptService = new InteractivePromptService();
  const createdRelations: Array<{ relationId: string; toType: string; toId: string; relationType: string }> = [];

  // Fetch all entities in parallel
  const [components, guidelines, invariants, decisions] = await Promise.all([
    container.componentContextReader.findAll(),
    container.guidelineContextReader.findAll(),
    container.invariantContextReader.findAll(),
    container.decisionContextReader.findAllActive(),
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
 * Renders goal details for review during refinement
 * Displays: Goal ID, Status, Objective, Success Criteria, Scope In, Scope Out
 */
function renderGoalDetails(goal: GoalView, renderer: Renderer): void {
  // Goal ID and Status
  renderer.section("Goal Details");
  renderer.info(`Goal ID: ${goal.goalId}`);
  renderer.info(`Status: ${goal.status}`);

  // Objective
  renderer.section("Objective");
  renderer.info(goal.objective);

  // Success Criteria
  if (goal.successCriteria && goal.successCriteria.length > 0) {
    renderer.section("Success Criteria");
    goal.successCriteria.forEach((criteria) => {
      renderer.info(`  - ${criteria}`);
    });
  }

  // Scope In
  if (goal.scopeIn && goal.scopeIn.length > 0) {
    renderer.section("Scope In");
    goal.scopeIn.forEach((item) => {
      renderer.info(`  - ${item}`);
    });
  }

  // Scope Out
  if (goal.scopeOut && goal.scopeOut.length > 0) {
    renderer.section("Scope Out");
    goal.scopeOut.forEach((item) => {
      renderer.info(`  - ${item}`);
    });
  }
}

/**
 * Renders LLM instructions for refinement phase
 * Outputs entity exploration commands and relation add syntax
 */
function renderLlmRefinementPrompt(goalId: string, renderer: Renderer): void {
  renderer.info("\n@LLM: CRITICAL - Goal refinement requires comprehensive relation registration.");
  renderer.info("Relations capture essential context that will be provided when implementing this goal.");
  renderer.info("Incomplete relations result in missing architectural constraints, patterns, and domain");
  renderer.info("knowledge during implementation.");
  renderer.info("\nBE THOROUGH: Most goals require 5-10+ relations across multiple entity types.");

  // Entity exploration commands
  renderer.info("\nExplore project entities with these commands:");
  renderer.info("  jumbo invariants list    - Non-negotiable constraints");
  renderer.info("  jumbo guidelines list    - Recommended practices");
  renderer.info("  jumbo decisions list     - Architectural decisions");
  renderer.info("  jumbo components list    - System components");
  renderer.info("  jumbo dependencies list  - External dependencies");
  renderer.info("  jumbo architecture show  - Architecture overview");

  // Relation add syntax
  renderer.info("\nRegister relations with:");
  renderer.info(`  jumbo relation add --from-type goal --from-id ${goalId} --to-type <entity-type> --to-id <entity-id> --relation-type <type> --description "<description>"`);

  // Common relation types
  renderer.info("\nCommon relation types:");
  renderer.info("  involves     - Implementation will modify or interact with this entity");
  renderer.info("  uses         - Implementation will use or depend on this entity");
  renderer.info("  must-respect - Implementation must adhere to this constraint");
  renderer.info("  follows      - Implementation must follow this practice or standard");
  renderer.info("  implements   - Implementation applies or realizes this architectural decision");

  // Guidance on what to look for
  renderer.info("\nWhat to register:");
  renderer.info("  - Invariants: Architectural constraints the implementation must adhere to");
  renderer.info("  - Guidelines: Coding standards, testing requirements the implementation must follow");
  renderer.info("  - Decisions: Architectural patterns the implementation will apply");
  renderer.info("  - Components: Existing code this implementation will modify or depend on");
  renderer.info("  - Dependencies: External libraries the implementation will integrate");
  renderer.info("\nDO NOT approve refinement until comprehensive relations are registered!");
}

/**
 * Approves goal refinement by transitioning status from 'to-do' to 'refined'.
 * Uses RefineGoalCommandHandler to persist the state change via event sourcing.
 * Displays success message with goal details and LLM instruction for next step.
 */
async function approveGoal(
  goalId: string,
  container: IApplicationContainer,
  renderer: Renderer
): Promise<void> {
  // Execute refine command via handler
  const refineHandler = new RefineGoalCommandHandler(
    container.goalRefinedEventStore,
    container.goalRefinedEventStore,
    container.goalRefinedProjector,
    container.eventBus
  );

  const refineCommand: RefineGoalCommand = { goalId };
  const result = await refineHandler.execute(refineCommand);

  // Fetch updated view for display
  const updatedView = await container.goalRefinedProjector.findById(result.goalId);

  // Display success message with goalId and status
  renderer.success("Goal refined", {
    goalId: result.goalId,
    status: updatedView?.status
  });

  // Display @LLM instruction to run jumbo goal start
  renderer.info("\n@LLM: Goal is now refined and ready to start.");
  renderer.info(`Run: jumbo goal start --goal-id ${goalId}`);
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

