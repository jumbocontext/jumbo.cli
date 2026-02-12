import { TerminalOutputBuilder } from '../../../output/TerminalOutputBuilder.js';
import { TerminalOutput } from '../../../output/TerminalOutput.js';

/**
 * Specialized builder for goal.update-progress command output.
 * Encapsulates all output rendering for the update progress command.
 *
 * Pattern: Output builders contain ALL prompt and output content.
 * Command files must not duplicate or add additional output after calling the builder.
 */
export class GoalUpdateProgressOutputBuilder {
  private builder: TerminalOutputBuilder;

  constructor() {
    this.builder = new TerminalOutputBuilder();
  }

  /**
   * Build output for successful progress update.
   * Renders success message and full progress list.
   */
  buildSuccess(goalId: string, addedTask: string, progress: string[]): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt("✓ Progress updated");
    this.builder.addData({
      goalId,
      addedTask,
      totalProgress: progress.length
    });

    if (progress.length > 0) {
      const progressList = progress.map((task, index) => `  ${index + 1}. ${task}`).join('\n');
      this.builder.addPrompt(`Progress:\n${progressList}`);
    }

    return this.builder.build();
  }

  /**
   * Build output for progress update failure.
   * Renders error message when progress update fails.
   */
  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt("✗ Failed to update progress");
    this.builder.addData({
      message: error instanceof Error ? error.message : error
    });
    return this.builder.build();
  }
}
