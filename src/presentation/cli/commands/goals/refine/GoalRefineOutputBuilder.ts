import { TerminalOutputBuilder } from '../../../output/TerminalOutputBuilder.js';
import { TerminalOutput } from '../../../output/TerminalOutput.js';
import { GoalView } from '../../../../../application/goals/GoalView.js';

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
}
