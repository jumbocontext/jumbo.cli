import { TerminalOutputBuilder } from '../../../output/TerminalOutputBuilder.js';
import { TerminalOutput } from '../../../output/TerminalOutput.js';
import { ContextualGoalView } from '../../../../../application/context/goals/get/ContextualGoalView.js';

/**
 * Specialized builder for goal.start command output.
 * Preserves the existing effective prompt structure that guides LLM implementation.
 *
 * Renders goal context as structured LLM implementation instructions.
 */
export class GoalStartOutputBuilder {
  private builder: TerminalOutputBuilder;

  constructor() {
    this.builder = new TerminalOutputBuilder();
  }

  /**
   * Build complete goal start output from context view.
   * Preserves existing prompt structure and instructions.
   */
  build(contextualView: ContextualGoalView): TerminalOutput {
    const goal = contextualView.goal;
    const context = contextualView.context;

    // Opening prompt: Goal Implementation Instructions
    this.builder.addPrompt(
      "# Goal Implementation Instructions\n\n" +
      "You are the developer tasked with implementing the goal outlined below. DO NOT DEVIATE from the instructions.\n" +
      "You (the developer) are the perfect software engineer - the amalgamation of Robert C. Martin, Martin Fowler, and Eric Evans.\n" +
      "You write perfect, efficient, secure, and well-documented code."
    );

    // Objective section
    this.builder.addPrompt(
      `## Objective:\n'${goal.objective}'\n\n` +
      "INSTRUCTION: Your (the developer's) purpose for this goal is to fulfill this objective."
    );

    // Success Criteria section
    const successCriteriaText = goal.successCriteria.map(c => `- ${c}`).join('\n');
    this.builder.addPrompt(
      `## Success Criteria:\n${successCriteriaText}\n\n` +
      "INSTRUCTION: Your (the developer's) success in fulfilling the objective is measured by these specific criteria and adherence to the instructions below."
    );

    // Progress section (if exists)
    if (goal.progress && goal.progress.length > 0) {
      const progressText = goal.progress.map(p => `- ${p}`).join('\n');
      this.builder.addPrompt(
        `## Current Progress:\n${progressText}\n\n` +
        "INSTRUCTION: Implementation of this goal has previously been started.\n" +
        "Review the current progress to understand what has already been accomplished and continue from there."
      );
    }

    // Scope section (if scoped)
    if (this.isScoped(contextualView)) {
      if (goal.scopeIn && goal.scopeIn.length > 0) {
        const scopeInText = goal.scopeIn.map(s => `- ${s}`).join('\n');
        this.builder.addPrompt(
          `### Scope:\n#### In Scope\n${scopeInText}\n\n` +
          "INSTRUCTION: You (the developer) MUST work within the defined scope."
        );
      }

      if (goal.scopeOut && goal.scopeOut.length > 0) {
        const scopeOutText = goal.scopeOut.map(s => `- ${s}`).join('\n');
        this.builder.addPrompt(
          `#### Out of Scope\n${scopeOutText}\n\n` +
          "INSTRUCTION: Your (the developer) work MUST NOT overlap these items."
        );
      }
    }

    // Architecture section
    if (context.architecture) {
      const arch = context.architecture;
      let archText = `### Solution Architecture:\nHigh-level Description: ${arch.description}\n` +
                     `Organization Style: ${arch.organization}\n\n` +
                     "INSTRUCTION: Namespaces (directory structures) and file names introduced by you (the developer) MUST maintain the solution's architectural organization style.";

      if (arch.patterns && arch.patterns.length > 0) {
        const patternsText = arch.patterns.map(p => `- ${p}`).join('\n');
        archText += `\n\n#### Design Patterns:\n${patternsText}\n\n` +
                    "INSTRUCTION: You (the developer) MUST must leverage these architectural patterns where applicable.\n" +
                    "If the goal does not fit a prescribed pattern, then you MUST register the new architecture pattern with jumbo. Run 'jumbo architecture update --help' for further instructions.\n" +
                    "New patterns MUST not conflict with existing patterns. For example, if the solution uses a layered architecture pattern, then you MUST NOT introduce a microservices pattern.";
      }

      if (arch.principles && arch.principles.length > 0) {
        const principlesText = arch.principles.map(p => `- ${p}`).join('\n');
        archText += `\n\n#### Principles:\n${principlesText}\n\n` +
                    "INSTRUCTION: Artifacts created by you (the developer) MUST directly reflect these principles.";
      }

      this.builder.addPrompt(archText);
    }

    // Components section
    if (context.components.length > 0) {
      const componentsText = context.components
        .map(c => `- ${c.entity.name}: ${c.entity.description}`)
        .join('\n');
      this.builder.addPrompt(
        `## Relevant Components:\n${componentsText}\n\n` +
        'INSTRUCTION: You (the developer) MUST consider these components while implementing this goal.'
      );
    }

    // Dependencies section
    if (context.dependencies.length > 0) {
      const dependenciesText = context.dependencies
        .map(d => {
          const version = d.entity.versionConstraint ? `@${d.entity.versionConstraint}` : "";
          const purpose = d.entity.contract || d.entity.endpoint || "External dependency";
          return `- ${d.entity.ecosystem}:${d.entity.packageName}${version} (${d.entity.name}): ${purpose}`;
        })
        .join('\n');
      this.builder.addPrompt(
        `## Relevant Dependencies:\n${dependenciesText}\n\n` +
        'INSTRUCTION: You (the developer) MUST consider the following dependencies while implementing this goal.'
      );
    }

    // Decisions section
    if (context.decisions.length > 0) {
      const decisionsText = context.decisions
        .map(d => `- ${d.entity.title}: ${d.entity.rationale}`)
        .join('\n');
      this.builder.addPrompt(
        `## Relevant Decisions:\n${decisionsText}\n\n` +
        'INSTRUCTION: The solution may contain artifacts that reflect previous design decisions.\n' +
        'Therefore, you MUST consider these design decisions while implementing this goal to ensure the trajectory of the solution remains consistent.'
      );
    }

    // Invariants section (CRITICAL - emphasized)
    if (context.invariants.length > 0) {
      const invariantsText = context.invariants
        .map(inv => `- ${inv.entity.title}:\n  - ${inv.entity.description}`)
        .join('\n');
      this.builder.addPrompt(
        `## Invariants:\n${invariantsText}\n\n` +
        'INSTRUCTION: You (the developer) MUST adhere to ALL of these invariants while implementing this goal.'
      );
    }

    // Guidelines section
    if (context.guidelines.length > 0) {
      const guidelinesText = context.guidelines
        .map(g => `- ${g.entity.category}: ${g.entity.description}`)
        .join('\n');
      this.builder.addPrompt(
        `## Guidelines:\n${guidelinesText}\n\n` +
        'INSTRUCTION: You (the developer) SHOULD follow these guidelines while implementing this goal.'
      );
    }

    // Closing prompt with additional instructions
    this.builder.addPrompt(
      "---\n\n" +
      "@LLM: Goal context loaded. Work within scope.\n" +
      `Track your progress by documenting completed sub-tasks with 'jumbo goal update-progress --id ${goal.goalId} --task-description <description>'.`
    );

    // Review instructions (prominent)
    this.builder.addPrompt(
      "=".repeat(80) + "\n" +
      "🚀 WHEN YOU'RE FINISHED IMPLEMENTING THEN THE NEXT STEP IS:\n" +
      `Run: jumbo goal submit --id ${goal.goalId}\n` +
      "=".repeat(80)
    );

    return this.builder.build();
  }

  private isScoped(contextualView: ContextualGoalView): boolean {
    return (
      (Array.isArray(contextualView.goal.scopeIn) && contextualView.goal.scopeIn.length > 0) ||
      (Array.isArray(contextualView.goal.scopeOut) && contextualView.goal.scopeOut.length > 0)
    );
  }
}
