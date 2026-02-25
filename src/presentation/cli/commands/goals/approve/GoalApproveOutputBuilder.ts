import { TerminalOutputBuilder } from '../../../output/TerminalOutputBuilder.js';
import { TerminalOutput } from '../../../output/TerminalOutput.js';
import { QualifyGoalResponse } from '../../../../../application/context/goals/qualify/QualifyGoalResponse.js';

/**
 * Specialized builder for goal.approve command output.
 * Encapsulates all output rendering for the approve goal command.
 *
 * Pattern: Output builders contain ALL prompt and output content.
 * Command files must not duplicate or add additional output after calling the builder.
 */
export class GoalApproveOutputBuilder {
  private builder: TerminalOutputBuilder;

  constructor() {
    this.builder = new TerminalOutputBuilder();
  }

  /**
   * Build output for successful goal approval.
   * Renders approval result with next steps.
   */
  buildSuccess(response: QualifyGoalResponse): TerminalOutput {
    this.builder.reset();

    // Header and success message
    this.builder.addPrompt(
      "# Goal Approved\n" +
      `Goal ID: ${response.goalId}\n` +
      `Objective: ${response.objective}\n` +
      `Status: ${response.status}\n` +
      "---\n\n" +
      "## QA Review Passed\n" +
      "The goal has been approved and is ready for codification.\n" +
      "---"
    );

    // Next steps
    let nextSteps = "## Next Steps\n" +
                    "Codify the goal:\n" +
                    `  Run: jumbo goal codify --id ${response.goalId}`;

    if (response.nextGoalId) {
      nextSteps += "\n\nAfter closing, the next goal in the queue is:\n" +
                   `  Goal ID: ${response.nextGoalId}`;
    }

    nextSteps += "\n---\n";

    this.builder.addPrompt(nextSteps);

    return this.builder.build();
  }

  /**
   * Build output for goal approval failure.
   * Renders error message when goal approval fails.
   */
  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt("✗ Failed to approve goal");
    this.builder.addData({
      message: error instanceof Error ? error.message : error
    });
    return this.builder.build();
  }
}
