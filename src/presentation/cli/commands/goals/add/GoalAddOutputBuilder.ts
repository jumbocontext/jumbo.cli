import { TerminalOutputBuilder } from '../../../output/TerminalOutputBuilder.js';
import { TerminalOutput } from '../../../output/TerminalOutput.js';

/**
 * Specialized builder for goal.add command output.
 * Encapsulates all output rendering for the add goal command.
 *
 * Pattern: Output builders contain ALL prompt and output content.
 * Command files must not duplicate or add additional output after calling the builder.
 */
export class GoalAddOutputBuilder {
  private builder: TerminalOutputBuilder;

  constructor() {
    this.builder = new TerminalOutputBuilder();
  }

  /**
   * Build output for interactive goal creation header.
   * Renders the opening message for interactive mode.
   */
  buildInteractiveHeader(): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt("\n=== Interactive Goal Creation ===\n");
    return this.builder.build();
  }

  /**
   * Build output for successful goal creation.
   * Renders success message with goal details.
   */
  buildSuccess(goalId: string, title: string, objective: string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt("✓ Goal defined");
    this.builder.addData({
      goalId,
      title,
      objective,
      status: 'defined',
      message: `  goalId: ${goalId}\n  title: ${title}\n  objective: ${objective}\n  status: defined`
    });
    return this.builder.build();
  }

  /**
   * Build output for missing objective error.
   * Renders error when --objective is not provided in non-interactive mode.
   */
  buildMissingObjectiveError(): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt("✗ Missing required option");
    this.builder.addData({
      message: '--objective is required (or use --interactive for guided creation)'
    });
    return this.builder.build();
  }

  /**
   * Build output for general goal creation failure.
   * Renders error message when goal creation fails.
   */
  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt("✗ Failed to define goal");
    this.builder.addData({
      message: error instanceof Error ? error.message : error
    });
    return this.builder.build();
  }
}
