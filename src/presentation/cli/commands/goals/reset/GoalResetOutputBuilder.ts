import { TerminalOutputBuilder } from '../../../output/TerminalOutputBuilder.js';
import { TerminalOutput } from '../../../output/TerminalOutput.js';

/**
 * Specialized builder for goal.reset command output.
 * Encapsulates all output rendering for the reset goal command.
 *
 * Pattern: Output builders contain ALL prompt and output content.
 * Command files must not duplicate or add additional output after calling the builder.
 */
export class GoalResetOutputBuilder {
  private builder: TerminalOutputBuilder;

  constructor() {
    this.builder = new TerminalOutputBuilder();
  }

  /**
   * Build output for successful goal reset.
   * Renders success message with goal details.
   */
  buildSuccess(goalId: string, objective: string, status: string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt("✓ Goal reset to to-do status");
    this.builder.addData({
      goalId,
      objective,
      status
    });
    return this.builder.build();
  }

  /**
   * Build output for goal reset failure.
   * Renders error message when goal reset fails.
   */
  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt("✗ Failed to reset goal");
    this.builder.addData({
      message: error instanceof Error ? error.message : error
    });
    return this.builder.build();
  }
}
