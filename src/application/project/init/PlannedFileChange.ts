/**
 * Represents a file system change that will occur or has occurred during initialization.
 * Used for both preview (before execution) and progress (after execution).
 */
export interface PlannedFileChange {
  /** Relative path from project root (e.g., "AGENTS.md", ".claude/settings.json") */
  path: string;
  /** Whether the file will be created or modified */
  action: "create" | "modify";
  /** Human-readable description of what this file is for */
  description: string;
}
