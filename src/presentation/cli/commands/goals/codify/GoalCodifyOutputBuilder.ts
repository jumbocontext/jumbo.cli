import { TerminalOutputBuilder } from '../../../output/TerminalOutputBuilder.js';
import { TerminalOutput } from '../../../output/TerminalOutput.js';
import { CodifyGoalResponse } from '../../../../../application/context/goals/codify/CodifyGoalResponse.js';

/**
 * Specialized builder for goal.codify command output.
 * Encapsulates all output rendering for the codify goal command.
 *
 * Pattern: Output builders contain ALL prompt and output content.
 * Command files must not duplicate or add additional output after calling the builder.
 */
export class GoalCodifyOutputBuilder {
  private builder: TerminalOutputBuilder;

  constructor() {
    this.builder = new TerminalOutputBuilder();
  }

  /**
   * Build output for successful goal codification start.
   * Renders codification instructions including architectural reconciliation prompt.
   */
  buildSuccess(response: CodifyGoalResponse): TerminalOutput {
    this.builder.reset();

    const goal = response.goalContextView.goal;

    // Header
    let headerText = "# Goal Codifying - Architectural Reconciliation\n" +
      `Goal ID: ${goal.goalId}\n` +
      `Objective: ${goal.objective}\n` +
      `Status: ${goal.status}`;
    if (goal.branch) {
      headerText += `\nBranch: ${goal.branch}`;
    }
    if (goal.worktree) {
      headerText += `\nWorktree: ${goal.worktree}`;
    }
    headerText += "\n---";
    this.builder.addPrompt(headerText);

    // Section 1: Capture new learnings
    this.builder.addPrompt(
      "## Capture Learnings\n" +
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
      "  Add: jumbo relation add --from-type <type> --from-id <id> --to-type <type> --to-id <id> --type <type> --strength <level>"
    );

    this.builder.addPrompt(
      "## Update Documentation\n" +
      "@LLM: Did you make any changes that should be reflected in the user documentation?\n" +
      "Did the changes introduce any new features, modify existing behavior, or fix bugs that users should be aware of?\n" +
      "If yes to either, then:\n" +
      "  - Propose updates to the ~/docs/*\n" +
      "  - Update the CHANGELOG.md\n"
    );

    // Next step
    this.builder.addPrompt(
      "## Next Step\n" +
      "After completing the reconciliation above, close the goal:\n" +
      `  Run: jumbo goal close --id ${goal.goalId}\n` +
      "---"
    );

    return this.builder.build();
  }

  /**
   * Build output for goal codification failure.
   */
  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt("✗ Failed to codify goal");
    this.builder.addData({
      message: error instanceof Error ? error.message : error
    });
    return this.builder.build();
  }
}
