import { TerminalOutputBuilder } from '../../../output/TerminalOutputBuilder.js';
import { TerminalOutput } from '../../../output/TerminalOutput.js';
import { CloseGoalResponse } from '../../../../../application/context/goals/close/CloseGoalResponse.js';

/**
 * Specialized builder for goal.close command output.
 * Encapsulates all output rendering for the close goal command.
 *
 * Pattern: Output builders contain ALL prompt and output content.
 * Command files must not duplicate or add additional output after calling the builder.
 */
export class GoalCloseOutputBuilder {
  private builder: TerminalOutputBuilder;

  constructor() {
    this.builder = new TerminalOutputBuilder();
  }

  /**
   * Build output for successful goal close.
   * Renders close confirmation and optional next goal information.
   */
  buildSuccess(response: CloseGoalResponse): TerminalOutput {
    this.builder.reset();

    // Header
    this.builder.addPrompt(
      "# Goal Closed\n" +
      `Goal ID: ${response.goalId}\n` +
      `Objective: ${response.objective}\n` +
      `Status: ${response.status}\n` +
      "---"
    );

    // Next goal in chain (if exists)
    if (response.nextGoal) {
      this.builder.addPrompt("## Next goal in chain:");
      this.builder.addData({
        goalId: response.nextGoal.goalId,
        objective: response.nextGoal.objective,
        status: response.nextGoal.status,
      });
      this.builder.addPrompt(
        "Start the next goal immediately. Run:\n" +
        `  jumbo goal start --id ${response.nextGoal.goalId}`
      );
    }

    return this.builder.build();
  }

  /**
   * Build output for goal close failure.
   */
  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt("✗ Failed to close goal");
    this.builder.addData({
      message: error instanceof Error ? error.message : error
    });
    return this.builder.build();
  }
}
