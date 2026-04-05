/**
 * Command Metadata Model
 *
 * Formalized model for command metadata that enables:
 * - Self-documenting commands
 * - Consistent CLI behavior
 * - Auto-generated help text
 * - Build-time command discovery
 */

/**
 * Command option definition
 */
export interface CommandOption {
  /** Option flags (e.g., "--id <goalId>" or "-g, --id <goalId>") */
  flags: string;
  /** Human-readable description of what this option does */
  description: string;
  /** Default value if not provided (only for optional options) */
  default?: string | number | boolean;
  /** Hide this option from help output (but still accept it) */
  hidden?: boolean;
}

/**
 * Usage example for a command
 */
export interface CommandExample {
  /** Example command invocation */
  command: string;
  /** What this example demonstrates */
  description: string;
}

/**
 * Command category for organizing help output
 */
export type CommandCategory = "host" | "project-knowledge" | "relations" | "solution" | "work";

/**
 * Complete command metadata
 */
export interface CommandMetadata {
  /** Command description (shown in help) */
  description: string;
  /** Category for grouping in help output (gh-style organization) */
  category?: CommandCategory;
  /** Required options (command will error if not provided) */
  requiredOptions?: CommandOption[];
  /** Optional options */
  options?: CommandOption[];
  /** Usage examples (shown in detailed help) */
  examples?: CommandExample[];
  /** Related commands (for discoverability) */
  related?: string[];
  /** Hide from main help (for deprecated/experimental commands) */
  hidden?: boolean;
  /** Top-level command aliases (e.g., ["init"] makes "jumbo init" work like "jumbo project init") */
  topLevelAliases?: string[];
  /**
   * Whether this command requires an initialized Jumbo project to run.
   * @default true - Most commands require project context
   * Set to false for commands like "project init" that bootstrap a new project.
   */
  requiresProject?: boolean;
}

/**
 * Shared option for cross-phase transition commands.
 * When present, next-step output is a directive; when absent, output is informational guidance.
 */
export const CONTINUE_OPTION: CommandOption = {
  flags: "-c, --continue",
  description: "Output next-step as a directive instead of informational guidance",
};

/**
 * Registered command with handler
 * Generated at build time by scanning command files
 */
export interface RegisteredCommand {
  /** Command path (e.g., "goal start", "project init") */
  path: string;
  /** Command metadata */
  metadata: CommandMetadata;
  /** Command handler function */
  handler: (...args: any[]) => Promise<void>;
}

/**
 * Convention: Command file paths map to command paths
 *
 * File: work/goal.start.ts
 *   → Parent: "goal" (from filename prefix)
 *   → Subcommand: "start" (from filename suffix)
 *   → Full path: "goal start"
 *
 * File: project-knowledge/project.init.ts
 *   → Parent: "project"
 *   → Subcommand: "init"
 *   → Full path: "project init"
 */
export function parseCommandPath(filePath: string): {
  parent: string;
  subcommand: string;
} {
  // Extract filename without extension: "goal.start.ts" → "goal.start"
  const filename = filePath.split("/").pop()?.replace(/\.ts$/, "") || "";

  // Split on dot: "goal.start" → ["goal", "start"]
  const parts = filename.split(".");

  if (parts.length !== 2) {
    throw new Error(
      `Invalid command filename: ${filePath}. Expected format: <parent>.<subcommand>.ts`
    );
  }

  return {
    parent: parts[0],
    subcommand: parts[1],
  };
}
