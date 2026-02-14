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
   * Build output for goal refinement success (approval mode).
   * Renders success message and LLM instruction to start the goal.
   */
  buildSuccess(goalId: string, status: string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt("✓ Goal refined");
    this.builder.addData({ goalId, status });
    this.builder.addPrompt(
      "\n@LLM: Goal is now refined and ready to start.\n" +
      `Run: jumbo goal start --goal-id ${goalId}`
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
   * Build output for approval instruction (default mode).
   * Renders LLM instruction to review and approve when ready.
   */
  buildApprovalInstruction(goalId: string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(
      "\n@LLM: Review goal details above. When ready to approve refinement, run:\n" +
      `  jumbo goal refine --goal-id ${goalId} --approve`
    );
    return this.builder.build();
  }

  /**
   * Build output for goal details and LLM refinement prompt (default/approve mode).
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
      "\nBE THOROUGH: Most goals require 5-10+ relations across multiple entity types."
    );

    // Entity exploration commands
    this.builder.addPrompt(
      "\nExplore project entities with these commands:\n" +
      "  jumbo invariants list    - Non-negotiable constraints\n" +
      "  jumbo guidelines list    - Recommended practices\n" +
      "  jumbo decisions list     - Architectural decisions\n" +
      "  jumbo components list    - System components\n" +
      "  jumbo dependencies list  - External dependencies\n" +
      "  jumbo architecture show  - Architecture overview"
    );

    // Relation add syntax
    this.builder.addPrompt(
      "\nRegister relations with:\n" +
      `  jumbo relation add --from-type goal --from-id ${goal.goalId} --to-type <entity-type> --to-id <entity-id> --relation-type <type> --description "<description>"`
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

    // Guidance on what to register
    this.builder.addPrompt(
      "\nWhat to register:\n" +
      "  - Invariants: Architectural constraints the implementation must adhere to\n" +
      "  - Guidelines: Coding standards, testing requirements the implementation must follow\n" +
      "  - Decisions: Architectural patterns the implementation will apply\n" +
      "  - Components: Existing code this implementation will modify or depend on\n" +
      "  - Dependencies: External libraries the implementation will integrate\n" +
      "\nDO NOT approve refinement until comprehensive relations are registered!"
    );

    return this.builder.build();
  }
}
