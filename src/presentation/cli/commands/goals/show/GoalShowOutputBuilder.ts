import { TerminalOutputBuilder } from '../../../output/TerminalOutputBuilder.js';
import { TerminalOutput } from '../../../output/TerminalOutput.js';
import { GoalView } from '../../../../../application/goals/GoalView.js';

/**
 * Specialized builder for goal.show command output.
 * Encapsulates all output rendering for the show goal command.
 *
 * Pattern: Output builders contain ALL prompt and output content.
 * Command files must not duplicate or add additional output after calling the builder.
 */
export class GoalShowOutputBuilder {
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
        return "doing (in progress)";
      case "blocked":
        return "blocked";
      case "to-do":
        return "to-do (planned)";
      case "done":
        return "done (completed)";
      case "refined":
        return "refined (ready to start)";
      case "paused":
        return "paused (temporarily stopped)";
      case "in-review":
        return "in-review (awaiting QA)";
      case "qualified":
        return "qualified (ready for completion)";
      default:
        return status;
    }
  }

  /**
   * Build output for TTY (human-readable formatted text).
   * Renders complete goal details with all fields.
   */
  buildTtyOutput(goal: GoalView): TerminalOutput {
    this.builder.reset();

    let output = "\n=== Goal Details ===\n\n" +
                 `Goal ID:    ${goal.goalId}\n` +
                 `Objective:  ${goal.objective}\n` +
                 `Status:     ${this.formatStatus(goal.status)}\n` +
                 `Version:    ${goal.version}\n` +
                 `Created:    ${goal.createdAt}\n` +
                 `Updated:    ${goal.updatedAt}`;

    if (goal.note) {
      output += `\n\nNote:\n  ${goal.note}`;
    }

    if (goal.successCriteria.length > 0) {
      output += "\n\nSuccess Criteria:";
      for (const criterion of goal.successCriteria) {
        output += `\n  - ${criterion}`;
      }
    }

    if (goal.scopeIn.length > 0 || goal.scopeOut.length > 0) {
      output += "\n\nScope:";
      if (goal.scopeIn.length > 0) {
        output += "\n  In:";
        for (const item of goal.scopeIn) {
          output += `\n    - ${item}`;
        }
      }
      if (goal.scopeOut.length > 0) {
        output += "\n  Out:";
        for (const item of goal.scopeOut) {
          output += `\n    - ${item}`;
        }
      }
    }

    if (goal.nextGoalId) {
      output += `\n\nNext Goal:  ${goal.nextGoalId}`;
    }

    if (goal.claimedBy) {
      output += "\n\nClaim:" +
                `\n  Claimed By:  ${goal.claimedBy}` +
                `\n  Claimed At:  ${goal.claimedAt}` +
                `\n  Expires At:  ${goal.claimExpiresAt}`;
    }

    output += "\n\n---\n" +
              "NOTE: This command provides goal overview only.\n" +
              "To load full implementation context (architecture, decisions, invariants),\n" +
              `run: jumbo goal start --goal-id ${goal.goalId}\n`;

    this.builder.addPrompt(output);
    return this.builder.build();
  }

  /**
   * Build output for non-TTY (structured JSON for programmatic consumers).
   * Renders goal data as structured object.
   */
  buildStructuredOutput(goal: GoalView): TerminalOutput {
    this.builder.reset();
    this.builder.addData({
      goalId: goal.goalId,
      objective: goal.objective,
      successCriteria: goal.successCriteria,
      scopeIn: goal.scopeIn,
      scopeOut: goal.scopeOut,
      status: goal.status,
      version: goal.version,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
      note: goal.note,
      nextGoalId: goal.nextGoalId,
      claimedBy: goal.claimedBy,
      claimedAt: goal.claimedAt,
      claimExpiresAt: goal.claimExpiresAt
    });
    return this.builder.build();
  }

  /**
   * Build output for goal not found error.
   * Renders error message when goal doesn't exist.
   */
  buildGoalNotFoundError(goalId: string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt("✗ Goal not found");
    this.builder.addData({ message: `No goal exists with ID: ${goalId}` });
    return this.builder.build();
  }

  /**
   * Build output for goal show failure.
   * Renders error message when showing goal fails.
   */
  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt("✗ Failed to show goal");
    this.builder.addData({
      message: error instanceof Error ? error.message : error
    });
    return this.builder.build();
  }
}
