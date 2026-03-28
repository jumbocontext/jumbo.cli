import { TerminalOutputBuilder } from '../../../output/TerminalOutputBuilder.js';
import { TerminalOutput } from '../../../output/TerminalOutput.js';
import { ContextualGoalView } from '../../../../../application/context/goals/get/ContextualGoalView.js';
import { Colors } from '../../../rendering/StyleConfig.js';

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
      case "defined":
        return "defined (planned)";
      case "done":
        return "done (completed)";
      case "refined":
        return "refined (ready to start)";
      case "paused":
        return "paused (temporarily stopped)";
      case "in-review":
        return "in-review (awaiting QA)";
      case "approved":
        return "approved (ready for codification)";
      case "rejected":
        return "rejected (needs rework)";
      case "unblocked":
        return "unblocked (ready to resume)";
      default:
        return status;
    }
  }

  /**
   * Build output for TTY (human-readable formatted text).
   * Renders complete goal details with all fields.
   */
  build(contextualView: ContextualGoalView): TerminalOutput {
    this.builder.reset();
    const goal = contextualView.goal;
    const context = contextualView.context;

    let output = Colors.gradientA("\n=== Goal Details ===\n") + "\n" +
                 Colors.gradientB("Goal ID:    ") + Colors.gradientC(goal.goalId) + "\n" +
                 Colors.gradientB("Title:      ") + Colors.gradientC(goal.title) + "\n" +
                 Colors.gradientB("Objective:  ") + Colors.gradientC(goal.objective) + "\n" +
                 Colors.gradientB("Status:     ") + Colors.gradientC(this.formatStatus(goal.status)) + "\n" +
                 Colors.gradientB("Version:    ") + Colors.gradientC(String(goal.version)) + "\n" +
                 Colors.gradientB("Created:    ") + Colors.gradientC(goal.createdAt) + "\n" +
                 Colors.gradientB("Updated:    ") + Colors.gradientC(goal.updatedAt);

    if (goal.note) {
      output += "\n\n" + Colors.gradientB("Note:") + "\n  " + Colors.gradientC(goal.note);
    }

    if (goal.reviewIssues) {
      output += "\n\n" + Colors.gradientB("Review Issues:") + "\n  " + Colors.gradientC(goal.reviewIssues);
    }

    if (goal.successCriteria.length > 0) {
      output += "\n\n" + Colors.gradientB("Success Criteria:");
      for (const criterion of goal.successCriteria) {
        output += "\n  - " + Colors.gradientC(criterion);
      }
    }

    if (goal.scopeIn.length > 0 || goal.scopeOut.length > 0) {
      output += "\n\n" + Colors.gradientB("Scope:");
      if (goal.scopeIn.length > 0) {
        output += "\n  " + Colors.gradientB("In:");
        for (const item of goal.scopeIn) {
          output += "\n    - " + Colors.gradientC(item);
        }
      }
      if (goal.scopeOut.length > 0) {
        output += "\n  " + Colors.gradientB("Out:");
        for (const item of goal.scopeOut) {
          output += "\n    - " + Colors.gradientC(item);
        }
      }
    }

    if (goal.prerequisiteGoals && goal.prerequisiteGoals.length > 0) {
      output += "\n\n" + Colors.gradientB("Prerequisite Goals:");
      for (const prereqId of goal.prerequisiteGoals) {
        output += "\n  - " + Colors.gradientC(prereqId);
      }
    }

    if (goal.nextGoalId) {
      output += "\n\n" + Colors.gradientB("Next Goal:  ") + Colors.gradientC(goal.nextGoalId);
    }

    if (goal.branch || goal.worktree) {
      output += "\n\n" + Colors.gradientB("Workspace:");
      if (goal.branch) {
        output += "\n  " + Colors.gradientB("Branch:    ") + Colors.gradientC(goal.branch);
      }
      if (goal.worktree) {
        output += "\n  " + Colors.gradientB("Worktree:  ") + Colors.gradientC(goal.worktree);
      }
    }

    if (goal.claimedBy) {
      output += "\n\n" + Colors.gradientB("Claim:") +
                "\n  " + Colors.gradientB("Claimed By:  ") + Colors.gradientC(goal.claimedBy) +
                "\n  " + Colors.gradientB("Claimed At:  ") + Colors.gradientC(goal.claimedAt!) +
                "\n  " + Colors.gradientB("Expires At:  ") + Colors.gradientC(goal.claimExpiresAt!);
    }

    this.builder.addPrompt(output);

    // Architecture section
    if (context.architecture) {
      const arch = context.architecture;
      let archOutput = Colors.gradientA("\n=== Architecture ===\n") + "\n" +
                       Colors.gradientB("Description: ") + Colors.gradientC(arch.description) + "\n" +
                       Colors.gradientB("Organization: ") + Colors.gradientC(arch.organization);

      if (arch.patterns && arch.patterns.length > 0) {
        archOutput += "\n\n" + Colors.gradientB("Design Patterns:");
        for (const pattern of arch.patterns) {
          archOutput += "\n  - " + Colors.gradientC(pattern);
        }
      }

      if (arch.principles && arch.principles.length > 0) {
        archOutput += "\n\n" + Colors.gradientB("Principles:");
        for (const principle of arch.principles) {
          archOutput += "\n  - " + Colors.gradientC(principle);
        }
      }

      this.builder.addPrompt(archOutput);
    }

    // Components section
    if (context.components.length > 0) {
      let componentsOutput = Colors.gradientA("\n=== Related Components ===\n");
      for (const component of context.components) {
        componentsOutput += "\n- " + Colors.gradientB(component.entity.name + ":") + " \n\t" + Colors.gradientC(component.entity.description);
      }
      this.builder.addPrompt(componentsOutput);
    }

    // Dependencies section
    if (context.dependencies.length > 0) {
      let dependenciesOutput = Colors.gradientA("\n=== Related Dependencies ===\n");
      for (const dependency of context.dependencies) {
        const version = dependency.entity.versionConstraint ? `@${dependency.entity.versionConstraint}` : "";
        const purpose = dependency.entity.contract || dependency.entity.endpoint || "External dependency";
        dependenciesOutput += "\n- " + Colors.gradientB(`${dependency.entity.ecosystem}:${dependency.entity.packageName}${version} (${dependency.entity.name}):`) + " \n\t" + Colors.gradientC(purpose);
      }
      this.builder.addPrompt(dependenciesOutput);
    }

    // Decisions section
    if (context.decisions.length > 0) {
      let decisionsOutput = Colors.gradientA("\n=== Related Decisions ===\n");
      for (const decision of context.decisions) {
        decisionsOutput += "\n- " + Colors.gradientB(decision.entity.title + ":") + " \n\t" + Colors.gradientC(decision.entity.rationale);
      }
      this.builder.addPrompt(decisionsOutput);
    }

    // Invariants section
    if (context.invariants.length > 0) {
      let invariantsOutput = Colors.gradientA("\n=== Invariants ===\n");
      for (const invariant of context.invariants) {
        invariantsOutput += "\n- " + Colors.gradientB(invariant.entity.title + ":") + " \n\t" + Colors.gradientC(invariant.entity.description);
      }
      this.builder.addPrompt(invariantsOutput);
    }

    // Guidelines section
    if (context.guidelines.length > 0) {
      let guidelinesOutput = Colors.gradientA("\n=== Guidelines ===\n");
      for (const guideline of context.guidelines) {
        guidelinesOutput += "\n- " + Colors.gradientB(guideline.entity.category + ":") + " \n\t" + Colors.gradientC(guideline.entity.description);
      }
      this.builder.addPrompt(guidelinesOutput);
    }

    // Closing note
    this.builder.addPrompt(
      "\n---\n" +
      "NOTE: To load this goal with full LLM implementation instructions,\n" +
      `run: jumbo goal start --id ${goal.goalId}\n`
    );

    return this.builder.build();
  }

  /**
   * Build output for non-TTY (structured JSON for programmatic consumers).
   * Renders complete goal context as structured object.
   */
  buildStructuredOutput(contextualView: ContextualGoalView): TerminalOutput {
    this.builder.reset();
    const goal = contextualView.goal;
    const context = contextualView.context;

    this.builder.addData({
      goal: {
        goalId: goal.goalId,
        title: goal.title,
        objective: goal.objective,
        successCriteria: goal.successCriteria,
        scopeIn: goal.scopeIn,
        scopeOut: goal.scopeOut,
        status: goal.status,
        version: goal.version,
        createdAt: goal.createdAt,
        updatedAt: goal.updatedAt,
        note: goal.note,
        reviewIssues: goal.reviewIssues,
        nextGoalId: goal.nextGoalId,
        prerequisiteGoals: goal.prerequisiteGoals,
        claimedBy: goal.claimedBy,
        claimedAt: goal.claimedAt,
        claimExpiresAt: goal.claimExpiresAt,
        branch: goal.branch,
        worktree: goal.worktree
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
