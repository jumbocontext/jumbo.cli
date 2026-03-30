/**
 * Domain Value Object: Cursor Rules Content
 *
 * Codifies the content for .cursor/rules/jumbo.mdc that directs
 * Cursor agents to read JUMBO.md on startup.
 * Handles content generation with YAML frontmatter (alwaysApply: true)
 * and section replacement for repair operations.
 *
 * Rationale: Codified in domain rather than template file to support
 * npm distribution (no file copying during build).
 */

export class CursorRulesContent {
  private static readonly SECTION_MARKER = "<!-- jumbo:cursor-rules -->";

  /**
   * Generate full .cursor/rules/jumbo.mdc content with YAML frontmatter
   * and a reference to JUMBO.md.
   */
  static getFullContent(): string {
    return `---
alwaysApply: true
---

${this.SECTION_MARKER}

# Jumbo Context Management

See JUMBO.md and follow all instructions. If the file does not exist, then ignore this instruction.
`;
  }

  /**
   * Marker used to detect if Jumbo section already exists in the rules file.
   */
  static getSectionMarker(): string {
    return this.SECTION_MARKER;
  }

  /**
   * Replace the Jumbo section in an existing rules file with the current content.
   * Finds the section marker and replaces everything from there to EOF
   * with the current section content.
   *
   * @returns Updated content, or null if marker not found
   */
  static replaceSection(existingContent: string): string | null {
    const markerIndex = existingContent.indexOf(this.SECTION_MARKER);

    if (markerIndex === -1) return null;

    const before = existingContent.substring(0, markerIndex);

    return before + `${this.SECTION_MARKER}

# Jumbo Context Management

See JUMBO.md and follow all instructions. If the file does not exist, then ignore this instruction.
`;
  }
}
