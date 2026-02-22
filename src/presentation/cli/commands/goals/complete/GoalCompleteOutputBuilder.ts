import { TerminalOutputBuilder } from '../../../output/TerminalOutputBuilder.js';
import { TerminalOutput } from '../../../output/TerminalOutput.js';
import { CompleteGoalResponse } from '../../../../../application/context/goals/complete/CompleteGoalResponse.js';

/**
 * Specialized builder for goal.complete command output.
 * Encapsulates all output rendering for the complete goal command.
 *
 * Pattern: Output builders contain ALL prompt and output content.
 * Command files must not duplicate or add additional output after calling the builder.
 */
export class GoalCompleteOutputBuilder {
  private builder: TerminalOutputBuilder;

  constructor() {
    this.builder = new TerminalOutputBuilder();
  }

  /**
   * Build output for successful goal completion.
   * Renders learning capture prompt, entity review, and optional next goal information.
   */
  buildSuccess(response: CompleteGoalResponse): TerminalOutput {
    this.builder.reset();

    // Section 1: Capture new learnings
    this.builder.addPrompt(
      "# Goal Completed - Capture Learnings\n" +
      "@LLM: Reflect on your interaction with the user during this goal.\n" +
      "Did it surface any NEW invariants, guidelines, decisions, components, dependencies, or architectural patterns not yet captured?\n" +
      "Were you corrected in a way that reveals a missing rule?\n" +
      "Only propose additions that are:\n" +
      "  - Universal (applicable beyond this specific goal)\n" +
      "  - Dense (one sentence, no examples unless the example IS the rule)\n" +
      "  - Actionable (changes how code is written or decisions are made)\n" +
      "If nothing qualifies, say so. Avoid restating what's already captured.\n" +
      "Run 'jumbo --help' for command details."
    );

    // Section 2: Review registered entities for staleness
    this.builder.addPrompt(
      "## Review Registered Entities\n" +
      "@LLM: This goal may have changed the codebase in ways that affect registered entities.\n" +
      "For each entity type below, consider whether any existing registrations need updating based on the work performed.\n\n" +
      "### Components\n" +
      "Did any component descriptions, responsibilities, or paths change? Were any components deprecated or removed?\n" +
      "  Update: jumbo component update --id <id> --description \"...\" --responsibility \"...\"\n" +
      "  Deprecate: jumbo component deprecate --id <id> --reason \"...\"\n" +
      "  Add new: jumbo component add --name \"...\" --type \"...\" --description \"...\" --responsibility \"...\" --path \"...\"\n\n" +
      "### Decisions\n" +
      "Were any architectural decisions made, superseded, or invalidated by this work?\n" +
      "  Add: jumbo decision add --title \"...\" --context \"...\" --rationale \"...\"\n" +
      "  Update: jumbo decision update --id <id> --rationale \"...\"\n" +
      "  Supersede: jumbo decision supersede --id <id> --new-decision-id <new-id>\n\n" +
      "### Invariants\n" +
      "Were any invariants introduced, weakened, strengthened, or made obsolete?\n" +
      "  Add: jumbo invariant add --title \"...\" --description \"...\" --enforcement \"...\"\n" +
      "  Update: jumbo invariant update --id <id> --description \"...\" --enforcement \"...\"\n" +
      "  Remove: jumbo invariant remove --id <id>\n\n" +
      "### Guidelines\n" +
      "Were any coding, testing, or documentation guidelines introduced or changed?\n" +
      "  Add: jumbo guideline add --category \"...\" --title \"...\" --description \"...\"\n" +
      "  Update: jumbo guideline update --guideline-id <id> --description \"...\"\n" +
      "  Remove: jumbo guideline remove --guideline-id <id>\n\n" +
      "### Dependencies\n" +
      "Were any inter-component dependencies added, removed, or changed?\n" +
      "  Add: jumbo dependency add --consumer-id <id> --provider-id <id> --contract \"...\"\n" +
      "  Update: jumbo dependency update --id <id> --contract \"...\"\n" +
      "  Remove: jumbo dependency remove --id <id>\n\n" +
      "### Architecture\n" +
      "Did this work change the architecture style, principles, or patterns?\n" +
      "  Update: jumbo architecture update --style \"...\" --principles \"...\"\n\n" +
      "### Relations\n" +
      "Should any new relations be established between entities touched by this goal?\n" +
      "  Add: jumbo relation add --from-type <type> --from-id <id> --to-type <type> --to-id <id> --relation-type <type> --strength <level>"
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
   * Build output for goal completion failure.
   * Renders error message when goal completion fails.
   */
  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt("✗ Failed to complete goal");
    this.builder.addData({
      message: error instanceof Error ? error.message : error
    });
    return this.builder.build();
  }
}
