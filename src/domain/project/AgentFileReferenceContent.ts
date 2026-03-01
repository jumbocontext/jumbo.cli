/**
 * Domain Value Object: Agent File Reference Content
 *
 * Codifies the reference text appended to CLAUDE.md and GEMINI.md
 * that directs agents to read AGENTS.md on startup.
 * Handles content generation and section replacement.
 *
 * Rationale: Codified in domain rather than template file to support
 * npm distribution (no file copying during build).
 */

export class AgentFileReferenceContent {
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
}
