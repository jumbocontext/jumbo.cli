import { TerminalOutputBuilder } from '../../../output/TerminalOutputBuilder.js';
import { TerminalOutput } from '../../../output/TerminalOutput.js';
import { ContextualGoalView } from '../../../../../application/context/goals/get/ContextualGoalView.js';

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
   * Renders learning capture prompt and optional next goal information.
   */
  buildSuccess(
    contextView: ContextualGoalView,
    nextGoal?: { goalId: string; objective: string; status: string }
  ): TerminalOutput {
    this.builder.reset();

    // Learning capture prompt
    this.builder.addPrompt(
      "# Goal Completed - Capture Learnings\n" +
      "@LLM: Reflect:\n" +
      "Did your interaction with the user while implementing this goal surface uncaptured invariants, guidelines, decisions, components, dependencies, or architectural patterns?\n" +
      "Were you corrected in any way that highlights a missing invariant, guideline, decision, component, dependency, or architectural pattern that should be captured?\n" +
      "If you answer 'yes' to any of these questions, propose additions to the knowledge base.\n" +
      "Only propose additions if they are:\n" +
      "  - Universal (applicable beyond this specific goal)\n" +
      "  - Dense (one sentence, no examples unless the example IS the rule)\n" +
      "  - Actionable (changes how code is written or decisions are made)\n" +
      "Capturable types: invariant, guideline, decision, component, dependency, architecture.\n" +
      "If nothing qualifies, say so. Avoid restating what's already captured.\n" +
      "Run 'jumbo --help' for command details.\n\n" +
      "## Register Components and Relations\n" +
      "@LLM: IMPORTANT - Register any components created during this goal:\n" +
      "1. Use 'jumbo component add' to register new components (services, libs, APIs, etc.)\n" +
      "2. Use 'jumbo relation add' to establish relationships:\n" +
      "   - Component dependencies (depends-on, uses)\n" +
      "   - Goal-to-component traceability (created, involves)\n" +
      "   - Architecture relationships (implements, extends)\n" +
      "   - Invariant relationships (respects)\n" +
      "   - Guideline relationships (follows)\n" +
      "   - Decision relationships (implements)\n" +
      "3. Building the relation graph enriches project context for future work.\n" +
      "Example:\n" +
      "  jumbo component add --name \"FooService\" --type \"service\" --description \"...\" --responsibility \"...\" --path \"src/...\"\n" +
      "  jumbo relation add --from-type component --from-id <new-component-id> --to-type component --to-id <base-component-id> --relation-type depends-on --strength strong\n" +
      "  jumbo relation add --from-type goal --from-id <this-goal-id> --to-type component --to-id <new-component-id> --relation-type created --strength strong"
    );

    // Next goal in chain (if exists)
    if (nextGoal) {
      this.builder.addPrompt("## Next goal in chain:");
      this.builder.addData({
        goalId: nextGoal.goalId,
        objective: nextGoal.objective,
        status: nextGoal.status,
      });
      this.builder.addPrompt(
        "Start the next goal immediately. Run:\n" +
        `  jumbo goal start --goal-id ${nextGoal.goalId}`
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
