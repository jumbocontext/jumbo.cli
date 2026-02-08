/**
 * Project Guard
 *
 * Validates whether a command requires an initialized Jumbo project.
 * Uses command metadata to determine project requirements instead of hard-coded logic.
 */

import { RegisteredCommand } from "../commands/registry/CommandMetadata.js";

/**
 * Result of project requirement validation
 */
export interface ProjectRequirementResult {
  /** Whether this command requires an initialized project */
  requiresProject: boolean;

  /** The resolved command path (e.g., "project init"), or null if not resolved */
  commandPath: string | null;
}

/**
 * Validates whether the current command requires an initialized Jumbo project.
 *
 * @param argv - Process arguments (process.argv)
 * @param commands - Registered commands from the command registry
 * @returns Object indicating if project is required and the resolved command path
 */
export function validateProjectRequirement(
  argv: string[],
  commands: RegisteredCommand[]
): ProjectRequirementResult {
  // Utility commands bypass project requirement
  if (isUtilityCommand(argv)) {
    return { requiresProject: false, commandPath: null };
  }

  // Resolve command path from args (handling aliases)
  const commandPath = resolveCommandPath(argv, commands);

  if (!commandPath) {
    // Unknown command or no command specified
    // Let Commander handle the error - don't require project
    return { requiresProject: false, commandPath: null };
  }

  // Look up metadata
  const command = commands.find((c) => c.path === commandPath);
  if (!command) {
    return { requiresProject: false, commandPath };
  }

  // Default to true if requiresProject not specified
  const requiresProject = command.metadata.requiresProject ?? true;

  return { requiresProject, commandPath };
}

/**
 * Checks if this is a utility command that should bypass project validation.
 * Utility commands include --help, -h, --version, -V which should work from any directory.
 */
function isUtilityCommand(argv: string[]): boolean {
  return (
    argv.includes("--help") ||
    argv.includes("-h") ||
    argv.includes("--version") ||
    argv.includes("-V")
  );
}

/**
 * Resolves the command path from process arguments, handling top-level aliases.
 *
 * Examples:
 * - ["node", "cli.js", "project", "init"] -> "project init"
 * - ["node", "cli.js", "init"] -> "project init" (via alias)
 * - ["node", "cli.js", "goal", "start", "--goal-id", "123"] -> "goal start"
 */
function resolveCommandPath(
  argv: string[],
  commands: RegisteredCommand[]
): string | null {
  // Remove node and script path
  const args = argv.slice(2);

  if (args.length === 0) {
    return null;
  }

  // Filter out flags to get positional args
  const positionalArgs = args.filter((arg) => !arg.startsWith("-"));

  if (positionalArgs.length === 0) {
    return null;
  }

  // First, check if this is a top-level alias
  const firstArg = positionalArgs[0];
  const aliasedCommand = commands.find((c) =>
    c.metadata.topLevelAliases?.includes(firstArg)
  );

  if (aliasedCommand) {
    return aliasedCommand.path;
  }

  // Otherwise, try to match as "parent subcommand"
  if (positionalArgs.length >= 2) {
    const commandPath = `${positionalArgs[0]} ${positionalArgs[1]}`;
    const matchingCommand = commands.find((c) => c.path === commandPath);
    if (matchingCommand) {
      return commandPath;
    }
  }

  // Could be just a parent command (e.g., "jumbo goal" to show help)
  // Return null to let Commander handle it
  return null;
}
