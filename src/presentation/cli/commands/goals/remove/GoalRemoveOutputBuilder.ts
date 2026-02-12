import { TerminalOutputBuilder } from '../../../output/TerminalOutputBuilder.js';
import { TerminalOutput } from '../../../output/TerminalOutput.js';

/**
 * Specialized builder for goal.remove command output.
 * Encapsulates all output rendering for the remove goal command.
 *
 * Pattern: Output builders contain ALL prompt and output content.
 * Command files must not duplicate or add additional output after calling the builder.
 */
export class GoalRemoveOutputBuilder {
  private builder: TerminalOutputBuilder;

  constructor() {
    this.builder = new TerminalOutputBuilder();
  }

  /**
   * Build output for successful goal removal.
   * Renders success message with goal ID and objective.
   */
  buildSuccess(goalId: string, objective: string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt("✓ Goal removed");
    this.builder.addData({
      goalId,
      objective
    });
    return this.builder.build();
  }

  /**
   * Build output for goal removal failure.
   * Renders error message when goal removal fails.
   */
  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt("✗ Failed to remove goal");
    this.builder.addData({
      message: error instanceof Error ? error.message : error
    });
    return this.builder.build();
  }
}
