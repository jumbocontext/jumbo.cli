import { TerminalOutputBuilder } from '../../../output/TerminalOutputBuilder.js';
import { TerminalOutput } from '../../../output/TerminalOutput.js';
import { GoalView } from '../../../../../application/context/goals/GoalView.js';

/**
 * Specialized builder for goals.list command output.
 * Encapsulates all output rendering for the list goals command.
 *
 * Pattern: Output builders contain ALL prompt and output content.
 * Command files must not duplicate or add additional output after calling the builder.
 */
export class GoalListOutputBuilder {
  private builder: TerminalOutputBuilder;

  constructor() {
    this.builder = new TerminalOutputBuilder();
  }

  /**
   * Format status with visual indicator
   */
  private formatStatus(status: string): string {
    switch (status) {
      case "doing":
        return "[DOING]  ";
      case "blocked":
        return "[BLOCKED]";
      case "defined":
        return "[DEFINED]";
      case "refined":
        return "[REFINED]";
      case "paused":
        return "[PAUSED] ";
      case "in-review":
        return "[IN-REVIEW]";
      case "approved":
        return "[APPROVED]";
      case "rejected":
        return "[REJECTED]";
      case "unblocked":
        return "[UNBLOCKED]";
      default:
        return `[${status.toUpperCase()}]`;
    }
  }

  /**
   * Build output for when no goals match the filter criteria.
   * Renders a custom message.
   */
  buildNoGoalsFound(message: string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(message);
    return this.builder.build();
  }

  /**
   * @deprecated Use buildNoGoalsFound instead
   * Build output for when there are no active goals.
   * Renders a message indicating all goals are completed.
   */
  buildNoActiveGoals(): TerminalOutput {
    return this.buildNoGoalsFound("No active goals. All goals are completed.");
  }

  /**
   * Build output for active goals list.
   * Renders header and formatted list of all non-completed goals.
   */
  buildActiveGoalsList(activeGoals: GoalView[]): TerminalOutput {
    this.builder.reset();

    // Sort: first approved, then in-review, then paused, then doing, then blocked, then refined, then defined, then by createdAt
    const statusOrder: Record<string, number> = {
      "approved": 0,
      "in-review": 1,
      "paused": 2,
      "doing": 3,
      "blocked": 4,
      "unblocked": 5,
      "refined": 6,
      "defined": 7
    };

    const sortedGoals = [...activeGoals].sort((a: GoalView, b: GoalView) => {
      const statusDiff = (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
      if (statusDiff !== 0) return statusDiff;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    // Build output as single prompt section
    let output = `\nActive Goals (${sortedGoals.length}):\n\n`;

    for (const goal of sortedGoals) {
      const status = this.formatStatus(goal.status);
      output += `${status}  ${goal.goalId}\n`;
      if (goal.title) {
        output += `           ${goal.title}\n`;
      }
      output += `           ${goal.objective}\n`;
      if (goal.note) {
        output += `           Note: ${goal.note}\n`;
      }
      output += "\n";
    }

    this.builder.addPrompt(output);
    return this.builder.build();
  }

  /**
   * Build output for non-TTY (structured JSON for programmatic consumers).
   * Renders list of goals as structured array.
   */
  buildStructuredOutput(activeGoals: GoalView[]): TerminalOutput {
    this.builder.reset();

    // Sort using same logic as human-readable output
    const statusOrder: Record<string, number> = {
      "approved": 0,
      "in-review": 1,
      "paused": 2,
      "doing": 3,
      "blocked": 4,
      "unblocked": 5,
      "refined": 6,
      "defined": 7
    };

    const sortedGoals = [...activeGoals].sort((a: GoalView, b: GoalView) => {
      const statusDiff = (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
      if (statusDiff !== 0) return statusDiff;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    this.builder.addData({
      goals: sortedGoals.map(goal => ({
        goalId: goal.goalId,
        title: goal.title,
        objective: goal.objective,
        status: goal.status,
        note: goal.note,
        createdAt: goal.createdAt,
        updatedAt: goal.updatedAt
      })),
      count: sortedGoals.length
    });
    return this.builder.build();
  }

  /**
   * Build output for goals list failure.
   * Renders error message when listing goals fails.
   */
  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt("✗ Failed to list goals");
    this.builder.addData({
      message: error instanceof Error ? error.message : error
    });
    return this.builder.build();
  }
}
