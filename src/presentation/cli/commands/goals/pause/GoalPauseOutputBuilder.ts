import { TerminalOutputBuilder } from '../../../output/TerminalOutputBuilder.js';
import { TerminalOutput } from '../../../output/TerminalOutput.js';
import { GoalPausedReasonsType } from '../../../../../domain/goals/GoalPausedReasons.js';

/**
 * Specialized builder for goal.pause command output.
 * Encapsulates all output rendering for the pause goal command.
 *
 * Pattern: Output builders contain ALL prompt and output content.
 * Command files must not duplicate or add additional output after calling the builder.
 */
export class GoalPauseOutputBuilder {
  private builder: TerminalOutputBuilder;

  constructor() {
    this.builder = new TerminalOutputBuilder();
  }

  /**
   * Build output for successful goal pause.
   * Renders success message with goal details and pause reason.
   */
  buildSuccess(
    goalId: string,
    objective: string,
    status: string,
    reason: GoalPausedReasonsType
  ): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt("✓ Goal paused");
    this.builder.addData({
      goalId,
      objective,
      status,
      reason
    });
    return this.builder.build();
  }

  /**
   * Build output for goal pause failure.
   * Renders error message when goal pause fails.
   */
  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt("✗ Failed to pause goal");
    this.builder.addData({
      message: error instanceof Error ? error.message : error
    });
    return this.builder.build();
  }
}
