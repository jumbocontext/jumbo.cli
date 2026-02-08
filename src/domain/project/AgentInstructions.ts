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
    return `## Instructions for Jumbo

**IMPORTANT: This project uses Jumbo CLI for agent orchestration and context management.**

Follow all prompts received from running \`jumbo\` commands.

### On Session Start
Run \`jumbo session start\`

### After Compaction/Compression
If a goal is actively being implemented.
Run \`jumbo goal resume --goal-id {active-goal-id}\`

### Before Finishing a Session
Run \`jumbo session end --focus {focus-description}\` --summary {summary-of-what-transpired}

### Before Starting Work on a Goal
Run \`jumbo goal start --goal-id <id>\`

### Be Proactive
Be vigilant in identifying insights, from your interactions with the user, that match the command types and ask the user if they would like you to register them with Jumbo.

### Available Commands
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
2. **Start a goal**: Before working on a task, run \`jumbo goal start --goal-id <id>\` to load goal-specific context
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
   * Marker used to detect if Jumbo section already exists in AGENTS.md
   */
  static getJumboSectionMarker(): string {
    return "## Instructions for Jumbo";
  }
}
