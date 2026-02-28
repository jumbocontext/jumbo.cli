/**
 * Domain Value Object: Copilot Instructions Content
 *
 * Codifies the GitHub Copilot instructions for copilot-instructions.md.
 * Handles content generation, section marker detection, and section replacement.
 *
 * Rationale: Codified in domain rather than template file to support
 * npm distribution (no file copying during build).
 */

export class CopilotInstructionsContent {
  /**
   * Generate GitHub Copilot instructions for copilot-instructions.md
   */
  static getCopilotInstructions(): string {
    return `## Jumbo Context Management

**IMPORTANT: This project uses Jumbo for AI memory and context management.**

GitHub Copilot does not support automatic SessionStart hooks, so you must manually
run Jumbo commands to load project context.

### MANDATORY FIRST ACTION

**Run \`jumbo session start\` at the beginning of each session.**

This loads orientation context including:
- Recent completed work and session state
- Planned goals and their success criteria
- Active architectural decisions
- System invariants and guidelines
- Project context and domain knowledge

### Working with Jumbo

1. **Start each session**: Run \`jumbo session start\` to load orientation context
2. **Start a goal**: Before working on a task, run \`jumbo goal start --id <id>\` to load goal-specific context
3. **Capture memories**: As you work, run jumbo commands to capture project knowledge:
   - \`jumbo component add\` - Track architectural components
   - \`jumbo decision add\` - Record architectural decisions (ADRs)
   - \`jumbo guideline add\` - Capture coding standards and preferences
   - \`jumbo invariant add\` - Document non-negotiable constraints
   - \`jumbo relation add\` - Link related entities

### Available Commands

Run \`jumbo --help\` to see all available commands.

### Learn More

See AGENTS.md for complete instructions on using Jumbo.

Run \`jumbo capabilities\` to learn about Jumbo's workflow and philosophy.
`;
  }

  /**
   * Marker used to detect if Jumbo section already exists in copilot-instructions.md
   */
  static getCopilotSectionMarker(): string {
    return "## Jumbo Context Management";
  }

  /**
   * Replace the Copilot section in copilot-instructions.md with the current version.
   * Finds "## Jumbo Context Management" heading and replaces everything from there
   * to the next "## " heading (or EOF) with current getCopilotInstructions().
   *
   * @returns Updated content, or null if marker not found
   */
  static replaceCopilotSection(existingContent: string): string | null {
    const marker = this.getCopilotSectionMarker();
    const markerIndex = existingContent.indexOf(marker);
    if (markerIndex === -1) return null;

    // Find the next ## heading after the marker (or EOF)
    const afterMarker = existingContent.substring(markerIndex + marker.length);
    const nextHeadingMatch = afterMarker.match(/\n## /);
    const endIndex = nextHeadingMatch
      ? markerIndex + marker.length + nextHeadingMatch.index!
      : existingContent.length;

    const before = existingContent.substring(0, markerIndex);
    const after = existingContent.substring(endIndex);

    return before + this.getCopilotInstructions() + after;
  }
}
