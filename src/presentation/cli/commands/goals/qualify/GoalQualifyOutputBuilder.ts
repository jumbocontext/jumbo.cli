import { TerminalOutputBuilder } from '../../../output/TerminalOutputBuilder.js';
import { TerminalOutput } from '../../../output/TerminalOutput.js';
import { QualifyGoalResponse } from '../../../../../application/context/goals/qualify/QualifyGoalResponse.js';

/**
 * Specialized builder for goal.qualify command output.
 * Encapsulates all output rendering for the qualify goal command.
 *
 * Pattern: Output builders contain ALL prompt and output content.
 * Command files must not duplicate or add additional output after calling the builder.
 *
 * @deprecated Use GoalApproveOutputBuilder instead. This command is deprecated
 * in favor of 'jumbo goal approve'.
 */
export class GoalQualifyOutputBuilder {
  private builder: TerminalOutputBuilder;

  constructor() {
    this.builder = new TerminalOutputBuilder();
  }

  /**
   * Build deprecation warning output.
   * Advises users to switch to 'jumbo goal approve'.
   */
  buildDeprecationWarning(): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(
      "⚠ Deprecation Notice: 'jumbo goal qualify' is deprecated. Use 'jumbo goal approve' instead.\n" +
      "---"
    );
    return this.builder.build();
  }

  /**
   * Build output for successful goal qualification.
   * Renders qualification result with next steps.
   */
  buildSuccess(response: QualifyGoalResponse): TerminalOutput {
    this.builder.reset();

    // Header and success message
    this.builder.addPrompt(
      "# Goal Qualified\n" +
      `Goal ID: ${response.goalId}\n` +
      `Objective: ${response.objective}\n` +
      `Status: ${response.status}\n` +
      "---\n\n" +
      "## QA Review Passed\n" +
      "The goal has been verified and approved for codification.\n" +
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
   * Build output for goal qualification failure.
   * Renders error message when goal qualification fails.
   */
  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt("✗ Failed to qualify goal");
    this.builder.addData({
      message: error instanceof Error ? error.message : error
    });
    return this.builder.build();
  }
}
