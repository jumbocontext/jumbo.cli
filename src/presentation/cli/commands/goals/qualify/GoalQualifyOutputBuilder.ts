import { TerminalOutputBuilder } from '../../../output/TerminalOutputBuilder.js';
import { TerminalOutput } from '../../../output/TerminalOutput.js';
import { ContextualGoalView } from '../../../../../application/context/goals/get/ContextualGoalView.js';

/**
 * Specialized builder for goal.qualify command output.
 * Encapsulates all output rendering for the qualify goal command.
 *
 * Pattern: Output builders contain ALL prompt and output content.
 * Command files must not duplicate or add additional output after calling the builder.
 */
export class GoalQualifyOutputBuilder {
  private builder: TerminalOutputBuilder;

  constructor() {
    this.builder = new TerminalOutputBuilder();
  }

  /**
   * Build output for successful goal qualification.
   * Renders qualification result with next steps.
   */
  buildSuccess(context: ContextualGoalView): TerminalOutput {
    this.builder.reset();

    const goal = context.goal;

    // Header and success message
    this.builder.addPrompt(
      "# Goal Qualified\n" +
      `Goal ID: ${goal.goalId}\n` +
      `Objective: ${goal.objective}\n` +
      `Status: ${goal.status}\n` +
      "---\n\n" +
      "## QA Review Passed\n" +
      "The goal has been verified and qualified for completion.\n" +
      "---"
    );

    // Next steps
    let nextSteps = "## Next Steps\n" +
                    "Complete the goal:\n" +
                    `  Run: jumbo goal complete --goal-id ${goal.goalId}`;

    if (goal.nextGoalId) {
      nextSteps += "\n\nAfter completion, the next goal in the queue is:\n" +
                   `  Goal ID: ${goal.nextGoalId}`;
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
