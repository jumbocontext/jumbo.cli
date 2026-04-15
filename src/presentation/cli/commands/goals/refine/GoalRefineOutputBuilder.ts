import { TerminalOutputBuilder } from '../../../output/TerminalOutputBuilder.js';
import { TerminalOutput } from '../../../output/TerminalOutput.js';
import { GoalView } from '../../../../../application/context/goals/GoalView.js';

/**
 * Specialized builder for goal.refine command output.
 * Encapsulates all output rendering for the refine goal command.
 *
 * Pattern: Output builders contain ALL prompt and output content.
 * Command files must not duplicate or add additional output after calling the builder.
 */
export class GoalRefineOutputBuilder {
  private builder: TerminalOutputBuilder;

  constructor() {
    this.builder = new TerminalOutputBuilder();
  }

  /**
   * Build output for goal refinement started success.
   * Renders success message and LLM instruction to commit the goal.
   */
  buildSuccess(goalId: string, status: string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt("✓ Goal refinement started");
    this.builder.addData({ goalId, status });
    this.builder.addPrompt(
      "\n@LLM: Goal refinement has started. Register relations and then commit.\n" +
      `Run: jumbo goal commit --id ${goalId}`
    );
    return this.builder.build();
  }

  /**
   * Build output for goal not found error.
   * Renders error message when goal doesn't exist.
   */
  buildGoalNotFoundError(goalId: string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt("✗ Goal not found");
    this.builder.addData({ message: `No goal exists with ID: ${goalId}` });
    return this.builder.build();
  }

  /**
   * Build output for goal refinement failure.
   * Renders error message when goal refinement fails.
   */
  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt("✗ Failed to refine goal");
    this.builder.addData({
      message: error instanceof Error ? error.message : error
    });
    return this.builder.build();
  }

  /**
   * Build output for interactive relation flow header.
   * Renders introduction for relation registration.
   */
  buildInteractiveFlowHeader(): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(
      "\n=== Goal Refinement: Register Relations ===\n\n" +
      "Select entities that this goal relates to.\n" +
      "Relations help track what components, decisions, and invariants are involved.\n"
    );
    return this.builder.build();
  }

  /**
   * Build output for created relations.
   * Renders list of relations that were registered.
   */
  buildCreatedRelations(relations: Array<{ relationType: string; toType: string; toId: string }>): TerminalOutput {
    this.builder.reset();
    const relationsList = relations.map(rel => `  - ${rel.relationType} → ${rel.toType}:${rel.toId}`).join('\n');
    this.builder.addPrompt(`\nRelations registered:\n${relationsList}`);
    return this.builder.build();
  }

  /**
   * Build output for goal details and LLM refinement prompt (default/interactive mode).
   * Renders goal details (ID, status, objective, criteria, scope) and LLM instructions
   * for comprehensive relation registration.
   */
  buildGoalDetailsAndRefinementPrompt(goal: GoalView): TerminalOutput {
    this.builder.reset();

    // Goal ID and Status section
    this.builder.addPrompt(
      "=== Goal Details ===\n" +
      `Goal ID: ${goal.goalId}\n` +
      `Status: ${goal.status}`
    );

    // Objective section
    this.builder.addPrompt(
      "\n=== Objective ===\n" +
      goal.objective
    );

    // Success Criteria section
    if (goal.successCriteria && goal.successCriteria.length > 0) {
      const criteriaText = goal.successCriteria.map(c => `  - ${c}`).join('\n');
      this.builder.addPrompt(
        "\n=== Success Criteria ===\n" +
        criteriaText
      );
    }

    // Scope In section
    if (goal.scopeIn && goal.scopeIn.length > 0) {
      const scopeInText = goal.scopeIn.map(s => `  - ${s}`).join('\n');
      this.builder.addPrompt(
        "\n=== Scope In ===\n" +
        scopeInText
      );
    }

    // Scope Out section
    if (goal.scopeOut && goal.scopeOut.length > 0) {
      const scopeOutText = goal.scopeOut.map(s => `  - ${s}`).join('\n');
      this.builder.addPrompt(
        "\n=== Scope Out ===\n" +
        scopeOutText
      );
    }

    // LLM Refinement Instructions
    this.builder.addPrompt(
      "\n@LLM: CRITICAL - Goal refinement requires comprehensive relation registration.\n" +
      "Relations capture essential context that will be provided when implementing this goal.\n" +
      "Incomplete relations result in missing architectural constraints, patterns, and domain\n" +
      "knowledge during implementation.\n" +
      "\nBE THOROUGH: Most goals require 5-10+ relations across multiple entity types.\n" +
      "\nPREREQUISITE DISCOVERY: As you analyze this goal, if you discover that work X must\n" +
      "happen before this goal can succeed, stop and register it:\n" +
      "  1. jumbo goal add --objective \"X that must happen first\"\n" +
      "  2. jumbo goal update --id " + goal.goalId + " --prerequisite-goals <new-goal-id>\n" +
      "  3. Continue refinement of this goal\n" +
      "Do not defer prerequisite registration — capture it the moment you identify it."
    );

    // Entity exploration commands
    this.builder.addPrompt(
      "\nExplore project entities with these commands:\n" +
      "  jumbo invariants list    - Non-negotiable constraints\n" +
      "  jumbo guidelines list    - Recommended practices\n" +
      "  jumbo decisions list     - Architectural decisions\n" +
      "  jumbo components search  - Search components (preferred over list)\n" +
      "  jumbo dependencies list  - External dependencies\n" +
      "\nComponent search (use targeted searches to reduce token cost):\n" +
      "  jumbo components search --name <substring>     Substring match (or use * wildcards: Auth*, *Service)\n" +
      "  jumbo components search --type <type>           Exact type: service, lib, api, db, ui, etc.\n" +
      "  jumbo components search --query <text>          Free-text across description and responsibility\n" +
      "  jumbo components search --output compact        Compact output: id, name, type only\n" +
      "  jumbo components list                           Full dump (use only if search is insufficient)"
    );

    // Relation add syntax
    this.builder.addPrompt(
      "\nRegister relations with:\n" +
      `  jumbo relation add --from-type goal --from-id ${goal.goalId} --to-type <entity-type> --to-id <entity-id> --type <type> --description "<description>"`
    );

    // Common relation types
    this.builder.addPrompt(
      "\nCommon relation types:\n" +
      "  involves     - Implementation will modify or interact with this entity\n" +
      "  uses         - Implementation will use or depend on this entity\n" +
      "  must-respect - Implementation must adhere to this constraint\n" +
      "  follows      - Implementation must follow this practice or standard\n" +
      "  implements   - Implementation applies or realizes this architectural decision"
    );

    // Guidance on what to register — split by evaluation strategy
    this.builder.addPrompt(
      "\nRELATION STRATEGY:\n" +
      "\nINVARIANTS & GUIDELINES — evaluate by exclusion:\n" +
      "  Run 'jumbo invariants list' and 'jumbo guidelines list'.\n" +
      "  Review every entry against the goal. For each, ask: 'Can I confidently say\n" +
      "  the implementing agent will never need this?' Only exclude those where the\n" +
      "  answer is clearly yes. A missed constraint causes QA rejections.\n" +
      "\nCOMPONENTS, DECISIONS & DEPENDENCIES — evaluate by inclusion:\n" +
      "  Use targeted searches to find entities the implementation will modify, use, or depend on.\n" +
      "  Relate entities with direct, actionable relevance to the goal.\n" +
      "\nAfter registering relations, commit the refinement:\n" +
      `  jumbo goal commit --id ${goal.goalId}`
    );

    return this.builder.build();
  }
}
