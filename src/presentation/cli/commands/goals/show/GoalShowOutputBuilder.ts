import { TerminalOutputBuilder } from '../../../output/TerminalOutputBuilder.js';
import { TerminalOutput } from '../../../output/TerminalOutput.js';
import { ContextualGoalView } from '../../../../../application/context/goals/get/ContextualGoalView.js';
import { Colors, BrandColors, Symbols, Templates, wordWrap } from '../../../rendering/StyleConfig.js';

/**
 * Layout constants matching the design system grid.
 *
 *   x=24  accent bar, dividers (2 leading spaces)
 *   x=38  section headings (bar + space)
 *   x=42  content: fields, body text, bullet markers
 *   x=54  indented: bullet text, scope items
 *
 * Max content width: 72 monospace characters from x=24.
 */
const EDGE = "  ";                // 2 spaces → x=24
const HEADING_PAD = "   ";        // bar(1) + space(1) + 1 extra = heading at x=38
const CONTENT_PAD = "     ";      // 5 spaces from x=24 → x=42 (content column)
const INDENT_PAD = "         ";   // 9 spaces from x=24 → x=54 (indented column)
const DIVIDER_WIDTH = 90;
const WRAP_CONTENT = 83;          // max chars at x=42 (90 - 7 leading)
const WRAP_INDENT = 81;           // max chars at x=54 (90 - 9 leading)

const STATUS_DISPLAY: Record<string, { symbol: string; color: (s: string) => string; label: string }> = {
  doing:       { symbol: Symbols.filledCircle, color: Colors.success,  label: "In Progress" },
  blocked:     { symbol: Symbols.cross,        color: Colors.error,    label: "Blocked" },
  defined:     { symbol: Symbols.dot,          color: Colors.muted,    label: "Planned" },
  done:        { symbol: Symbols.check,        color: Colors.success,  label: "Completed" },
  refined:     { symbol: Symbols.check,        color: Colors.accent,   label: "Ready to Start" },
  paused:      { symbol: Symbols.dot,          color: Colors.warning,  label: "Paused" },
  "in-review": { symbol: Symbols.filledCircle, color: Colors.warning,  label: "Awaiting QA" },
  approved:    { symbol: Symbols.check,        color: Colors.success,  label: "Ready for Codification" },
  rejected:    { symbol: Symbols.cross,        color: Colors.error,    label: "Needs Rework" },
  submitted:   { symbol: Symbols.filledCircle, color: Colors.success,  label: "Submitted" },
  unblocked:   { symbol: Symbols.filledCircle, color: Colors.accent,   label: "Ready to Resume" },
};

/**
 * Specialized builder for goal.show command output.
 * Encapsulates all output rendering for the show goal command.
 *
 * Visual language follows the Jumbo design system (mockups/design-system.svg):
 * - BrandColors.jumboBlue accent bar (|) as structural element at x=24
 * - Section headings at x=38, content at x=42, indented at x=54
 * - Only two dividers: after metadata block, before related context band
 * - BrandColors.accentCyan for entity names in Band 2
 * - Static footer with ➤ arrow
 *
 * Pattern: Output builders contain ALL prompt and output content.
 * Command files must not duplicate or add additional output after calling the builder.
 */
export class GoalShowOutputBuilder {
  private builder: TerminalOutputBuilder;

  constructor() {
    this.builder = new TerminalOutputBuilder();
  }

  private bar(): string {
    return BrandColors.jumboBlue(Symbols.accentBar);
  }

  private divider(): string {
    return `${EDGE}${Colors.dim("─".repeat(DIVIDER_WIDTH))}`;
  }

  private heading(title: string): string {
    return `${EDGE}${this.bar()} ${Colors.bold(BrandColors.jumboBlue(title))}`;
  }

  private metaField(label: string, value: string, labelWidth = 9): string {
    const padded = (label + ":").padEnd(labelWidth);
    return `${EDGE}${CONTENT_PAD}${Colors.muted(padded)}${value}`;
  }

  private contentLine(text: string): string {
    return `${EDGE}${CONTENT_PAD}${text}`;
  }

  private indentLine(text: string): string {
    return `${EDGE}${INDENT_PAD}${text}`;
  }

  private formatStatus(status: string): string {
    const entry = STATUS_DISPLAY[status];
    if (!entry) return Colors.primary(status);
    return `${entry.color(entry.symbol)} ${Colors.bold(Colors.primary(status))}`;
  }

  private wrapContent(text: string): string[] {
    return wordWrap(text, WRAP_CONTENT, 0).map(line =>
      `${EDGE}${CONTENT_PAD}${Colors.primary(line.trimStart())}`
    );
  }

  private wrapContentWithPrefix(prefix: string, text: string): string[] {
    const prefixLen = prefix.length + 1; // prefix + space
    const firstLineMax = WRAP_CONTENT - prefixLen;
    const words = text.split(/\s+/);
    const resultLines: string[] = [];
    let current = "";
    let isFirst = true;

    for (const word of words) {
      const max = isFirst ? firstLineMax : WRAP_CONTENT;
      if (current.length === 0) {
        current = word;
      } else if (current.length + 1 + word.length <= max) {
        current += " " + word;
      } else {
        if (isFirst) {
          resultLines.push(`${EDGE}${CONTENT_PAD}${BrandColors.accentCyan(prefix)} ${Colors.primary(current)}`);
          isFirst = false;
        } else {
          resultLines.push(`${EDGE}${CONTENT_PAD}${Colors.primary(current)}`);
        }
        current = word;
      }
    }
    if (current.length > 0) {
      if (isFirst) {
        resultLines.push(`${EDGE}${CONTENT_PAD}${BrandColors.accentCyan(prefix)} ${Colors.primary(current)}`);
      } else {
        resultLines.push(`${EDGE}${CONTENT_PAD}${Colors.primary(current)}`);
      }
    }

    return resultLines;
  }

  private wrapBulletContinuation(text: string): string[] {
    const lines = wordWrap(text, WRAP_INDENT, 0);
    const result: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trimStart();
      if (i === 0) {
        result.push(`${EDGE}${CONTENT_PAD}${Colors.dim("·")} ${Colors.primary(trimmed)}`);
      } else {
        result.push(`${EDGE}${INDENT_PAD}${Colors.primary(trimmed)}`);
      }
    }
    return result;
  }

  /**
   * Build output for TTY (human-readable formatted text).
   * Renders complete goal details with all fields.
   */
  build(contextualView: ContextualGoalView): TerminalOutput {
    this.builder.reset();
    const goal = contextualView.goal;
    const context = contextualView.context;
    const lines: string[] = [];

    // ── Band 1: Goal Identity + Details ──

    // Header: "| Goal" heading with title as content below
    lines.push("");
    lines.push(this.heading("Goal"));
    lines.push(this.contentLine(Colors.primary(goal.title || "Untitled Goal")));

    // Metadata block
    lines.push("");
    lines.push(this.metaField("Id", Colors.muted(goal.goalId)));
    lines.push(this.metaField("Status", this.formatStatus(goal.status)));
    lines.push(this.metaField("Version", Colors.muted(String(goal.version))));
    lines.push(this.metaField("Created", Colors.muted(goal.createdAt)));
    lines.push(this.metaField("Updated", Colors.muted(goal.updatedAt)));

    if (goal.nextGoalId) {
      lines.push(this.metaField("Next", Colors.muted(goal.nextGoalId)));
    }

    if (goal.prerequisiteGoals && goal.prerequisiteGoals.length > 0) {
      for (const prereqId of goal.prerequisiteGoals) {
        lines.push(this.metaField("Prereq", Colors.muted(prereqId)));
      }
    }

    // Divider 1: metadata → objective
    lines.push("");
    lines.push(this.divider());
    lines.push("");

    // Objective — wrapped at ~66 chars
    lines.push(this.heading("Objective"));
    lines.push(...this.wrapContent(goal.objective));

    // Note
    if (goal.note) {
      lines.push("");
      lines.push(this.heading("Note"));
      lines.push(...this.wrapContent(goal.note));
    }

    // Review Issues
    if (goal.reviewIssues) {
      lines.push("");
      lines.push(this.heading("Review Issues"));
      lines.push(this.contentLine(Colors.warning(goal.reviewIssues)));
    }

    // Success Criteria — bullet at x=42, text/continuation at x=54
    if (goal.successCriteria.length > 0) {
      lines.push("");
      lines.push(this.heading("Success Criteria"));
      for (const criterion of goal.successCriteria) {
        lines.push(...this.wrapBulletContinuation(criterion));
      }
    }

    // Scope
    if (goal.scopeIn.length > 0 || goal.scopeOut.length > 0) {
      lines.push("");
      lines.push(this.heading("Scope"));
      if (goal.scopeIn.length > 0) {
        lines.push(this.contentLine(Colors.bold("In:")));
        for (const item of goal.scopeIn) {
          lines.push(this.indentLine(`${Colors.success(Symbols.check)} ${Colors.primary(item)}`));
        }
      }
      if (goal.scopeOut.length > 0) {
        lines.push(this.contentLine(Colors.bold("Out:")));
        for (const item of goal.scopeOut) {
          lines.push(this.indentLine(`${Colors.error(Symbols.cross)} ${Colors.dim(item)}`));
        }
      }
    }

    // Workspace
    if (goal.branch || goal.worktree) {
      lines.push("");
      lines.push(this.heading("Workspace"));
      if (goal.branch) {
        lines.push(this.metaField("Branch", Colors.primary(goal.branch)));
      }
      if (goal.worktree) {
        lines.push(this.metaField("Worktree", Colors.primary(goal.worktree)));
      }
    }

    // Claim
    if (goal.claimedBy) {
      lines.push("");
      lines.push(this.heading("Claim"));
      lines.push(this.metaField("Claimed By", Colors.primary(goal.claimedBy)));
      lines.push(this.metaField("Claimed At", Colors.muted(goal.claimedAt!)));
      lines.push(this.metaField("Expires At", Colors.muted(goal.claimExpiresAt!)));
    }

    this.builder.addPrompt(lines.join("\n"));

    // ── Band 2: Related Context ──

    const hasArchContext = context.components.length > 0 ||
      context.dependencies.length > 0 ||
      context.decisions.length > 0 ||
      context.invariants.length > 0 ||
      context.guidelines.length > 0;

    if (hasArchContext) {
      const band2: string[] = [];

      // Divider 2: goal details → related context
      band2.push(this.divider());

      if (context.components.length > 0) {
        band2.push("");
        band2.push(this.heading("Related Components"));
        for (let i = 0; i < context.components.length; i++) {
          if (i > 0) band2.push("");
          band2.push(this.contentLine(BrandColors.accentCyan(context.components[i].entity.name)));
          band2.push(...this.wrapContent(context.components[i].entity.description));
        }
      }

      if (context.dependencies.length > 0) {
        band2.push("");
        band2.push(this.heading("Related Dependencies"));
        for (let i = 0; i < context.dependencies.length; i++) {
          if (i > 0) band2.push("");
          const dependency = context.dependencies[i];
          const version = dependency.entity.versionConstraint ? `@${dependency.entity.versionConstraint}` : "";
          const purpose = dependency.entity.contract || dependency.entity.endpoint || "External dependency";
          band2.push(this.contentLine(BrandColors.accentCyan(`${dependency.entity.ecosystem}:${dependency.entity.packageName}${version}`)));
          band2.push(...this.wrapContent(purpose));
        }
      }

      if (context.decisions.length > 0) {
        band2.push("");
        band2.push(this.heading("Related Decisions"));
        for (let i = 0; i < context.decisions.length; i++) {
          if (i > 0) band2.push("");
          band2.push(this.contentLine(BrandColors.accentCyan(context.decisions[i].entity.title)));
          band2.push(...this.wrapContent(context.decisions[i].entity.rationale ?? ""));
        }
      }

      if (context.invariants.length > 0) {
        band2.push("");
        band2.push(this.heading("Invariants"));
        for (let i = 0; i < context.invariants.length; i++) {
          if (i > 0) band2.push("");
          band2.push(this.contentLine(BrandColors.accentCyan(context.invariants[i].entity.title)));
          band2.push(...this.wrapContent(context.invariants[i].entity.description));
        }
      }

      if (context.guidelines.length > 0) {
        band2.push("");
        band2.push(this.heading("Guidelines"));
        for (let i = 0; i < context.guidelines.length; i++) {
          if (i > 0) band2.push("");
          band2.push(...this.wrapContentWithPrefix(
            `[${context.guidelines[i].entity.category}]`,
            context.guidelines[i].entity.description
          ));
        }
      }

      this.builder.addPrompt("\n\n" + band2.join("\n"));
    }

    // Footer — divider + directive
    this.builder.addPrompt(
      "\n" + this.divider() + "\n\n" +
      `${EDGE}${Colors.primary("➤")} ${Colors.primary(`To start: jumbo goal start --id ${goal.goalId}`)}\n`
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
    this.builder.addPrompt(Templates.errorMessage("Goal not found"));
    this.builder.addData({ message: `No goal exists with ID: ${goalId}` });
    return this.builder.build();
  }

  /**
   * Build output for goal show failure.
   * Renders error message when showing goal fails.
   */
  buildFailureError(error: Error | string): TerminalOutput {
    this.builder.reset();
    this.builder.addPrompt(Templates.errorMessage("Failed to show goal"));
    this.builder.addData({
      message: error instanceof Error ? error.message : error
    });
    return this.builder.build();
  }
}
