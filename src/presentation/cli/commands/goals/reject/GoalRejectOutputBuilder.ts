import { TerminalOutputBuilder } from '../../../output/TerminalOutputBuilder.js';
import { TerminalOutput } from '../../../output/TerminalOutput.js';
import { RejectGoalResponse } from '../../../../../application/context/goals/reject/RejectGoalResponse.js';

/**
 * Specialized builder for goal.reject command output.
 * Encapsulates all output rendering for the reject goal command.
 *
 * Pattern: Output builders contain ALL prompt and output content.
 * Command files must not duplicate or add additional output after calling the builder.
 */
export class GoalRejectOutputBuilder {
  private builder: TerminalOutputBuilder;

  constructor() {
    this.builder = new TerminalOutputBuilder();
  }

  /**
   * Build output for successful goal rejection.
   * Renders rejection result with review issues and next steps for the implementing agent.
   */
  buildSuccess(response: RejectGoalResponse, continueFlag: boolean = false): TerminalOutput {
    this.builder.reset();

    this.builder.addPrompt(
      "# Goal Rejected\n" +
      `Goal ID: ${response.goalId}\n` +
      `Objective: ${response.objective}\n` +
      `Status: ${response.status}\n` +
      "---\n\n" +
      "## QA Review Failed\n" +
      "The goal has been returned for rework. The following issues were found:\n\n" +
      `${response.reviewIssues}\n` +
      "---"
    );

    let nextSteps: string;

    if (continueFlag) {
      nextSteps = "## Next Steps\n" +
                  "The implementing agent should address the review issues and restart the goal:\n" +
                  `  Run: jumbo goal start --id ${response.goalId}`;
    } else {
      nextSteps = "## [Next Phase] Rework\n" +
                  "The implementing agent should address the review issues.\n" +
                  `To restart the goal: jumbo goal start --id ${response.goalId}`;
    }

    if (response.nextGoalId) {
      nextSteps += "\n\nThe next goal in the queue is:\n" +
                   `  Goal ID: ${response.nextGoalId}`;
    }

    nextSteps += "\n---\n";

    this.builder.addPrompt(nextSteps);

    return this.builder.build();
  }

  /**
   * Build output for goal rejection failure.
   * Renders error message when goal rejection fails.
   */
  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt("✗ Failed to reject goal");
    this.builder.addData({
      message: error instanceof Error ? error.message : error
    });
    return this.builder.build();
  }
}
