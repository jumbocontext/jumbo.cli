import { TerminalOutputBuilder } from '../../../output/TerminalOutputBuilder.js';
import { TerminalOutput } from '../../../output/TerminalOutput.js';
import { SubmitGoalResponse } from '../../../../../application/context/goals/submit/SubmitGoalResponse.js';

/**
 * Specialized builder for goal.submit command output.
 * Encapsulates all output rendering for the submit goal command.
 *
 * Pattern: Output builders contain ALL prompt and output content.
 * Command files must not duplicate or add additional output after calling the builder.
 */
export class GoalSubmitOutputBuilder {
  private builder: TerminalOutputBuilder;

  constructor() {
    this.builder = new TerminalOutputBuilder();
  }

  /**
   * Build output for successful goal submission.
   * Renders success message with next step to review the goal.
   */
  buildSuccess(response: SubmitGoalResponse): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(
      "# Goal Submitted\n" +
      `Goal ID: ${response.goalId}\n` +
      `Objective: ${response.objective}\n` +
      `Status: ${response.status}\n` +
      "---\n\n" +
      "@LLM: Implementation submitted. The goal is now awaiting QA review.\n" +
      `Run: jumbo goal review --id ${response.goalId}\n` +
      "---"
    );
    return this.builder.build();
  }

  /**
   * Build output for goal submit failure.
   * Renders error message when goal submission fails.
   */
  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt("✗ Failed to submit goal");
    this.builder.addData({
      message: error instanceof Error ? error.message : error
    });
    return this.builder.build();
  }
}
