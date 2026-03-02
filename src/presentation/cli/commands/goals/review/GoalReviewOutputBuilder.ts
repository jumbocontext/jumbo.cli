import { TerminalOutputBuilder } from '../../../output/TerminalOutputBuilder.js';
import { TerminalOutput } from '../../../output/TerminalOutput.js';
import { ReviewGoalResponse } from '../../../../../application/context/goals/review/ReviewGoalResponse.js';

/**
 * Specialized builder for goal.review command output.
 * Encapsulates all output rendering for the review goal command.
 *
 * Pattern: Output builders contain ALL prompt and output content.
 * Command files must not duplicate or add additional output after calling the builder.
 */
export class GoalReviewOutputBuilder {
  private builder: TerminalOutputBuilder;

  constructor() {
    this.builder = new TerminalOutputBuilder();
  }

  /**
   * Build output for successful goal review submission.
   * Renders comprehensive QA criteria for verification.
   */
  buildSuccess(response: ReviewGoalResponse): TerminalOutput {
    this.builder.reset();
    const goal = response.criteria.goal;
    const context = response.criteria.context;

    // Build complete review prompt as single section
    let output = "\n# Goal Review Instructions\n" +
                 "You are the quality assurance specialist tasked with reviewing the goal (outlined below) implementation. The implementation MUST NOT HAVE DEVIATED from the instructions.\n" +
                 "Your (the specialist's) skills are that of the perfect software engineer - the amalgamation of Robert C. Martin, Martin Fowler, and Eric Evans.\n" +
                 "You expect perfect, efficient, secure, and well-documented code.\n" +
                 "You are now in QA mode. Verify the implementation against the details below.\n" +
                 "Report and fix any failures.\n" +
                 "---\n\n";

    // Objective and Success Criteria
    output += `## Objective:\n'${goal.objective}'\n` +
              "## Success Criteria:\n";
    goal.successCriteria.forEach((c) => {
      output += `- ${c}\n`;
    });
    output += "\nVERIFY: Does the implementation succeed in fulfilling the objective and these specific criteria and adhere to the instructions below?\n" +
              `INSTRUCTION: If ANY criteria are NOT met, then note the issues for goal rejection.`;

    // Scope (if scoped)
    if (this.isScoped(response)) {
      output += "\n\n### Scope:";

      if (goal.scopeIn && goal.scopeIn.length > 0) {
        output += "\n#### In Scope\n";
        goal.scopeIn.forEach((item: string) => {
          output += `- ${item}\n`;
        });
        output += "\nVERIFY: The implementation stayed within the defined scope.\n" +
                  `INSTRUCTION: If any work was done outside the defined scope, then note the issues for goal rejection.`;
      }

      if (goal.scopeOut && goal.scopeOut.length > 0) {
        output += "\n#### Out of Scope\n";
        goal.scopeOut.forEach((item: string) => {
          output += `- ${item}\n`;
        });
        output += "\nVERIFY: The implementation did not overlap these items.\n" +
                  `INSTRUCTION: If any work overlapped these items, then note the issues for goal rejection.`;
      }
    }

    // Architecture
    if (context.architecture) {
      output += "\n\n### Solution Architecture:\n" +
                `High-level Description: ${context.architecture.description}\n\n` +
                `Organization Style: ${context.architecture.organization}\n\n` +
                "\nVERIFY: Namespaces (directory structures) and file names introduced by you (the developer) maintain the solution's architectural organization style.\n" +
                `INSTRUCTION: If any namespaces or file names do not maintain the solution's architectural organization style, then note the issues for goal rejection.`;

      if (context.architecture.patterns && context.architecture.patterns.length > 0) {
        output += "\n\n#### Design Patterns:\n";
        context.architecture.patterns.forEach((pattern: string) => {
          output += `- ${pattern}\n`;
        });
        output += "\nVERIFY: You (the developer) leveraged these architectural patterns where applicable.\n" +
                  "If the goal does not fit a prescribed pattern, then did you register the new architecture pattern with jumbo. Run 'jumbo architecture update --help' for further instructions.\n" +
                  "New patterns MUST not conflict with existing patterns. For example, if the solution uses a layered architecture pattern, then you MUST NOT introduce a microservices pattern.\n" +
                  `INSTRUCTION: If any architectural patterns were not leveraged or new patterns conflict with existing ones, then note the issues for goal rejection.`;
      }

      if (context.architecture.principles && context.architecture.principles.length > 0) {
        output += "\n\n#### Principles:\n";
        context.architecture.principles.forEach((principle: string) => {
          output += `- ${principle}\n`;
        });
        output += "\nVERIFY: Artifacts created by you (the developer) directly reflect these principles.\n" +
                  `INSTRUCTION: If any artifacts do not reflect these principles, then note the issues for goal rejection.`;
      }
    }

    // Components
    if (context.components.length > 0) {
      output += "\n\n## Relevant Components:\n";
      context.components.forEach((c) => {
        output += `- ${c.entity.name}: ${c.entity.description}\n`;
      });
      output += "\nVERIFY: These components were considered in the implementation.\n" +
                `INSTRUCTION: If any components were not considered, then note the issues for goal rejection.`;
    }

    // Dependencies
    if (context.dependencies.length > 0) {
      output += "\n\n## Relevant Dependencies:\n";
      context.dependencies.forEach((d) => {
        const version = d.entity.versionConstraint ? `@${d.entity.versionConstraint}` : "";
        const purpose = d.entity.contract || d.entity.endpoint || "External dependency";
        output += `- ${d.entity.ecosystem}:${d.entity.packageName}${version} (${d.entity.name}): ${purpose}\n`;
      });
      output += "\nVERIFY: These dependencies are considered in the implementation.\n" +
                `INSTRUCTION: If any dependencies were not considered, then note the issues for goal rejection.`;
    }

    // Decisions
    if (context.decisions.length > 0) {
      output += "\n\n## Relevant Decisions:\n";
      context.decisions.forEach((d) => {
        output += `- ${d.entity.title}: ${d.entity.rationale}\n`;
      });
      output += "\nNOTE: The solution may contain artifacts that reflect previous design decisions.\n" +
                "VERIFY:These design decisions are reflected in the implementation and ensure the trajectory of the solution is consistent.\n" +
                `INSTRUCTION: If any design decisions are not reflected or the trajectory is inconsistent, then note the issues for goal rejection.`;
    }

    // Invariants
    if (context.invariants.length > 0) {
      output += "\n\n## Invariants:\n";
      context.invariants.forEach((inv) => {
        output += `- ${inv.entity.title}:\n  - ${inv.entity.description}\n`;
      });
      output += "\nVERIFY: The implementation adheres to ALL of these invariants.\n" +
                `INSTRUCTION: If the implementation does not adhere to any of these invariants, then note the issues for goal rejection. `;
    }

    // Guidelines
    if (context.guidelines.length > 0) {
      output += "\n\n## Guidelines:\n";
      context.guidelines.forEach((g) => {
        output += `- ${g.entity.category}: ${g.entity.description}\n`;
      });
      output += "\nVERIFY: The implementation follows these guidelines.\n" +
                `INSTRUCTION: If the implementation does not follow any of these guidelines, then note the issues for goal rejection. `;
    }

    // Final instructions
    output += "\n\n---\n" +
              "## Next Steps\n" +
              "If ALL criteria are met:\n" +
              `  Run: jumbo goal approve --id ${response.goalId}\n\n` +
              "If ANY criteria are NOT met:\n" +
              `  Note the issues and reject the goal: jumbo goal reject --id ${response.goalId} --audit-findings <findings>\n` +
              "---\n";

    this.builder.addPrompt(output);
    return this.builder.build();
  }

  /**
   * Build output for goal review failure.
   * Renders error message when goal review fails.
   */
  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt("✗ Failed to submit goal for review");
    this.builder.addData({
      message: error instanceof Error ? error.message : error
    });
    return this.builder.build();
  }

  /**
   * Helper to determine if goal is scoped
   */
  private isScoped(response: ReviewGoalResponse): boolean {
    const goal = response.criteria.goal;
    return (
      (Array.isArray(goal.scopeIn) && goal.scopeIn.length > 0) ||
      (Array.isArray(goal.scopeOut) && goal.scopeOut.length > 0)
    );
  }
}
