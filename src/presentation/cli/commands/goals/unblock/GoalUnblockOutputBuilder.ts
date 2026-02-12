import { TerminalOutputBuilder } from '../../../output/TerminalOutputBuilder.js';
import { TerminalOutput } from '../../../output/TerminalOutput.js';

/**
 * Specialized builder for goal.unblock command output.
 * Encapsulates all output rendering for the unblock goal command.
 *
 * Pattern: Output builders contain ALL prompt and output content.
 * Command files must not duplicate or add additional output after calling the builder.
 */
export class GoalUnblockOutputBuilder {
  private builder: TerminalOutputBuilder;

  constructor() {
    this.builder = new TerminalOutputBuilder();
  }

  /**
   * Build output for successful goal unblock.
   * Renders success message with goal ID and optional resolution note.
   */
  buildSuccess(goalId: string, resolution?: string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt("✓ Goal unblocked");
    const data: Record<string, string> = { goalId };
    if (resolution) {
      data.resolution = resolution;
    }
    this.builder.addData(data);
    return this.builder.build();
  }

  /**
   * Build output for goal unblock failure.
   * Renders error message when goal unblock fails.
   */
  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt("✗ Failed to unblock goal");
    this.builder.addData({
      message: error instanceof Error ? error.message : error
    });
    return this.builder.build();
  }
}
