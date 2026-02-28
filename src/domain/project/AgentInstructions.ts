/**
 * Domain Value Object: Agent Instructions
 *
 * Codifies AI agent onboarding instructions for projects using Jumbo.
 * This content is written to AGENTS.md during project initialization.
 *
 * Rationale: Codified in domain rather than template file to support
 * npm distribution (no file copying during build).
 */

export class AgentInstructions {
  /**
   * Generate the Jumbo instructions section for AGENTS.md
   */
  static getJumboSection(): string {
    return `## Instructions for Agents on how to collaborate with Jumbo

Dear Agent,

This project uses Jumbo CLI for agent orchestration and context management. Follow all prompts received from running \`jumbo\` commands, and take full advantage of \`jumbo\` commands to ensure optimal collaboration and maximal efficiency in executing goals.

Sincerely,
Project Administrator

### When you start a new Session Start
Run \`jumbo session start\`

This orients you with the current state of the project: high-level project, recent events and a goal backlog to select work from.

### Pre Compaction/Compression
If a goal is actively being implemented.

Run \`jumbo work pause\`

### After Compaction/Compression
Run \`jumbo work resume\`

This will automatically serve context of a goal that you were progressing on prior to compaction.

### Before Finishing a Session
Run \`jumbo session end --focus {focus-description}\` --summary {summary-of-what-transpired}

### Before Starting Work on a Goal
Run \`jumbo goal start --id <id>\`

### Be Proactive - Use Jumbo to the Fullest Extent
Jumbo supercharges your abilities and consistency by supplying you with durable memory. Use is unsparingly. Be vigilant in identifying user decisions that change the existing standards for the project. Document when new patterns are introduced or removed. Capture corrections made by the user in the form of invariants or guidelines. If a new pattern is introduced, capture it. If a new component is introduced capture it. If new relations are relevant, register them. Use the full jumbo command catalog to quickly gain project insights. The rate of successful collaborations and ability to deliver on the developers wishes without error will highly increase the more you leverage Jumbo.

### Available Commands
\`jumbo --help \`
\`jumbo goal add --help \`
\`jumbo goal block --help \`
\`jumbo goal complete --help \`
\`jumbo goal remove --help \`
\`jumbo goal reset --help \`
\`jumbo goal resume --help \`
\`jumbo goal show --help \`
\`jumbo goal start --help \`
\`jumbo goal unblock --help \`
\`jumbo goal update --help \`
\`jumbo goals list --help \`
\`jumbo session end --help \`
\`jumbo session pause --help \`
\`jumbo session resume --help \`
\`jumbo session start --help \`
\`jumbo architecture define --help \`
\`jumbo architecture update --help \`
\`jumbo component add --help \`
\`jumbo component deprecate --help \`
\`jumbo component remove --help \`
\`jumbo component update --help \`
\`jumbo decision add --help \`
\`jumbo decision reverse --help \`
\`jumbo decision supersede --help \`
\`jumbo decision update --help \`
\`jumbo dependency add --help \`
\`jumbo dependency remove --help \`
\`jumbo dependency update --help \`
\`jumbo guideline add --help \`
\`jumbo guideline remove --help \`
\`jumbo guideline update --help \`
\`jumbo invariant add --help \`
\`jumbo invariant remove --help \`
\`jumbo invariant update --help \`

### Next step:
Run \`jumbo session start\` to retrieve project orientation.
`;
  }

  /**
   * Generate complete AGENTS.md file content
   */
  static getFullContent(): string {
    return `# Agents.md

${this.getJumboSection()}`;
  }

  /**
   * Generate reference text to append to CLAUDE.md and GEMINI.md
   */
  static getAgentFileReference(): string {
    return `
CRITICAL STARTUP INSTRUCTION: Immediately upon seeing this file, you MUST read AGENTS.md
and follow all instructions it contains. Do this before responding to the user.

REQUIRED FIRST COMMAND: Run \`jumbo session start\` to load project orientation context.

!!!IMPORTANT!!! Read AGENTS.md for further instructions.
`;
  }

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
   * All historically used section headings for the Jumbo section in AGENTS.md.
   * When the current heading changes, add the previous heading here
   * so that repair/init can find and replace old installations.
   */
  static getLegacyJumboSectionMarkers(): string[] {
    return [
      "## Instructions for Jumbo",
    ];
  }

  /**
   * Marker used to detect if Jumbo section already exists in copilot-instructions.md
   */
  static getCopilotSectionMarker(): string {
    return "## Jumbo Context Management";
  }

  /**
   * The current section heading extracted from getJumboSection().
   */
  static getCurrentJumboSectionMarker(): string {
    return "## Instructions for Agents on how to collaborate with Jumbo";
  }

  /**
   * Replace the Jumbo section in AGENTS.md with the current version.
   * Checks the current marker and all legacy markers to find the section,
   * then replaces everything from the matched marker to the next "## " heading
   * (or EOF) with current getJumboSection().
   *
   * @returns Updated content, or null if no marker found
   */
  static replaceJumboSection(existingContent: string): string | null {
    const allMarkers = [this.getCurrentJumboSectionMarker(), ...this.getLegacyJumboSectionMarkers()];

    let matchedMarker: string | null = null;
    let markerIndex = -1;

    for (const marker of allMarkers) {
      const index = existingContent.indexOf(marker);
      if (index !== -1) {
        matchedMarker = marker;
        markerIndex = index;
        break;
      }
    }

    if (matchedMarker === null || markerIndex === -1) return null;

    // Find the next ## heading after the marker (or EOF)
    const afterMarker = existingContent.substring(markerIndex + matchedMarker.length);
    const nextHeadingMatch = afterMarker.match(/\n## /);
    const endIndex = nextHeadingMatch
      ? markerIndex + matchedMarker.length + nextHeadingMatch.index!
      : existingContent.length;

    const before = existingContent.substring(0, markerIndex);
    const after = existingContent.substring(endIndex);

    return before + this.getJumboSection() + after;
  }

  /**
   * Replace the agent file reference block in CLAUDE.md or GEMINI.md.
   * Finds "CRITICAL STARTUP INSTRUCTION:" and replaces through the
   * "!!!IMPORTANT!!!" line with the current getAgentFileReference().
   *
   * @returns Updated content, or null if marker not found
   */
  static replaceAgentFileReference(existingContent: string): string | null {
    const startMarker = "CRITICAL STARTUP INSTRUCTION:";
    const endMarker = "!!!IMPORTANT!!!";

    const startIndex = existingContent.indexOf(startMarker);
    if (startIndex === -1) return null;

    const endMarkerIndex = existingContent.indexOf(endMarker, startIndex);
    if (endMarkerIndex === -1) return null;

    // Find end of the !!!IMPORTANT!!! line
    const endOfLine = existingContent.indexOf("\n", endMarkerIndex);
    const endIndex = endOfLine === -1 ? existingContent.length : endOfLine + 1;

    // Find the start of the line containing the startMarker
    const lineStart = existingContent.lastIndexOf("\n", startIndex);
    const blockStart = lineStart === -1 ? 0 : lineStart;

    const before = existingContent.substring(0, blockStart);
    const after = existingContent.substring(endIndex);

    return before + this.getAgentFileReference() + after;
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
