import { TerminalOutputBuilder } from '../../../output/TerminalOutputBuilder.js';
import { TerminalOutput } from '../../../output/TerminalOutput.js';
import { ContextualGoalView } from '../../../../../application/context/goals/get/ContextualGoalView.js';

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
  build(context: ContextualGoalView, addedTask: string): TerminalOutput {
    const goal = context.goal;
    const progress = goal.progress || [];

    // Success message with task info
    this.builder.addPrompt(
      `✓ Progress updated\n\n` +
      `Goal ID: ${goal.goalId}\n` +
      `Added Task: ${addedTask}\n` +
      `Total Progress Items: ${progress.length}`
    );

    // Progress list section
    if (progress.length > 0) {
      const progressList = progress.map((task, index) => `  ${index + 1}. ${task}`).join('\n');
      this.builder.addPrompt(`Progress:\n${progressList}`);
    }

    return this.builder.build();
  }
}
