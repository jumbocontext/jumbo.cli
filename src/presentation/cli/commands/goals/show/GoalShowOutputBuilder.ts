import { TerminalOutputBuilder } from '../../../output/TerminalOutputBuilder.js';
import { TerminalOutput } from '../../../output/TerminalOutput.js';
import { GoalContextView } from '../../../../../application/context/GoalContextView.js';

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
  build(context: GoalContextView): TerminalOutput {
    this.builder.reset();
    const goal = context.goal;

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

    this.builder.addPrompt(output);

    // Architecture section
    if (context.architecture) {
      const arch = context.architecture;
      let archOutput = `\n=== Architecture ===\n\n` +
                       `Description: ${arch.description}\n` +
                       `Organization: ${arch.organization}`;

      if (arch.patterns && arch.patterns.length > 0) {
        archOutput += "\n\nDesign Patterns:";
        for (const pattern of arch.patterns) {
          archOutput += `\n  - ${pattern}`;
        }
      }

      if (arch.principles && arch.principles.length > 0) {
        archOutput += "\n\nPrinciples:";
        for (const principle of arch.principles) {
          archOutput += `\n  - ${principle}`;
        }
      }

      this.builder.addPrompt(archOutput);
    }

    // Components section
    if (context.components.length > 0) {
      let componentsOutput = "\n=== Related Components ===\n";
      for (const component of context.components) {
        componentsOutput += `\n- ${component.name}: ${component.description}`;
      }
      this.builder.addPrompt(componentsOutput);
    }

    // Dependencies section
    if (context.dependencies.length > 0) {
      let dependenciesOutput = "\n=== Related Dependencies ===\n";
      for (const dependency of context.dependencies) {
        const purpose = dependency.contract || dependency.endpoint || 'Dependency relationship';
        dependenciesOutput += `\n- ${dependency.consumerId} → ${dependency.providerId}: ${purpose}`;
      }
      this.builder.addPrompt(dependenciesOutput);
    }

    // Decisions section
    if (context.decisions.length > 0) {
      let decisionsOutput = "\n=== Related Decisions ===\n";
      for (const decision of context.decisions) {
        decisionsOutput += `\n- ${decision.title}: ${decision.rationale}`;
      }
      this.builder.addPrompt(decisionsOutput);
    }

    // Invariants section
    if (context.invariants.length > 0) {
      let invariantsOutput = "\n=== Invariants ===\n";
      for (const invariant of context.invariants) {
        invariantsOutput += `\n- ${invariant.title}: ${invariant.description}`;
      }
      this.builder.addPrompt(invariantsOutput);
    }

    // Guidelines section
    if (context.guidelines.length > 0) {
      let guidelinesOutput = "\n=== Guidelines ===\n";
      for (const guideline of context.guidelines) {
        guidelinesOutput += `\n- ${guideline.category}: ${guideline.description}`;
      }
      this.builder.addPrompt(guidelinesOutput);
    }

    // Closing note
    this.builder.addPrompt(
      "\n---\n" +
      "NOTE: To load this goal with full LLM implementation instructions,\n" +
      `run: jumbo goal start --goal-id ${goal.goalId}\n`
    );

    return this.builder.build();
  }

  /**
   * Build output for non-TTY (structured JSON for programmatic consumers).
   * Renders complete goal context as structured object.
   */
  buildStructuredOutput(context: GoalContextView): TerminalOutput {
    this.builder.reset();
    const goal = context.goal;

    this.builder.addData({
      goal: {
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
      },
      architecture: context.architecture,
      components: context.components,
      dependencies: context.dependencies,
      decisions: context.decisions,
      invariants: context.invariants,
      guidelines: context.guidelines
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
