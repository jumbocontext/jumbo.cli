/**
 * Command Classifier
 *
 * Classifies CLI invocations to determine infrastructure and project requirements.
 * Uses command metadata as single source of truth.
 */

import { RegisteredCommand } from "./registry/CommandMetadata.js";
import { CLI_FLAGS, ARGV } from "../Constants.js";

/**
 * Classification result for a CLI invocation
 */
export interface CommandClassification {
  /** Whether this invocation requires infrastructure (application container) */
  requiresInfrastructure: boolean;

  /** Whether this invocation requires an initialized project (.jumbo directory) */
  requiresProject: boolean;

  /** The resolved command path (e.g., "project init"), or null if not resolved */
  commandPath: string | null;
}

/**
 * Classifies CLI invocations to determine infrastructure and project requirements.
 *
 * @param argv - Process arguments (process.argv)
 * @param commands - Registered commands from the command registry
 * @returns Classification indicating infrastructure and project requirements
 */
export function classifyCommand(
  argv: string[],
  commands: RegisteredCommand[]
): CommandClassification {
  // Utility commands (help, version) never require infrastructure or project
  if (isUtilityCommand(argv)) {
    return {
      requiresInfrastructure: false,
      requiresProject: false,
      commandPath: null,
    };
  }

  // Bare 'jumbo' command - only needs infrastructure if project exists (to show project info)
  // This is checked by caller since it requires filesystem access
  if (isBareCommand(argv)) {
    return {
      requiresInfrastructure: false, // Caller will check if project exists
      requiresProject: false,
      commandPath: null,
    };
  }

  // Subcommand help never requires infrastructure or project
  if (isSubcommandHelp(argv)) {
    return {
      requiresInfrastructure: false,
      requiresProject: false,
      commandPath: null,
    };
  }

  // Resolve command path from args (handling aliases)
  const commandPath = resolveCommandPath(argv, commands);

  if (!commandPath) {
    // Unknown command - let Commander handle the error
    return {
      requiresInfrastructure: false,
      requiresProject: false,
      commandPath: null,
    };
  }

  // Look up command metadata
  const command = commands.find((c) => c.path === commandPath);
  if (!command) {
    return {
      requiresInfrastructure: false,
      requiresProject: false,
      commandPath,
    };
  }

  // Use metadata to determine requirements
  // Default to true if requiresProject not specified
  const requiresProject = command.metadata.requiresProject ?? true;

  // All commands require infrastructure (even project init needs it to create databases)
  // Only help/version/bare command bypass infrastructure
  const requiresInfrastructure = true;

  return {
    requiresInfrastructure,
    requiresProject,
    commandPath,
  };
}

/**
 * Checks if this is a bare 'jumbo' command with no arguments.
 */
function isBareCommand(argv: string[]): boolean {
  return argv.length === ARGV.NODE_AND_SCRIPT_ARG_COUNT;
}

/**
 * Checks if this is a utility command that should bypass infrastructure.
 * Utility commands include --help, -h, --version, -v which should work from any directory.
 */
function isUtilityCommand(argv: string[]): boolean {
  const isExplicitHelp =
    (argv.includes(CLI_FLAGS.HELP_LONG) ||
      argv.includes(CLI_FLAGS.HELP_SHORT)) &&
    argv.length === ARGV.ROOT_COMMAND_ARG_COUNT;

  const isVersion =
    argv.includes(CLI_FLAGS.VERSION_LONG) ||
    argv.includes(CLI_FLAGS.VERSION_SHORT);

  return isExplicitHelp || isVersion;
}

/**
 * Checks if this is a subcommand help request.
 */
function isSubcommandHelp(argv: string[]): boolean {
  return (
    (argv.includes(CLI_FLAGS.HELP_LONG) ||
      argv.includes(CLI_FLAGS.HELP_SHORT)) &&
    argv.length > ARGV.ROOT_COMMAND_ARG_COUNT
  );
}

/**
 * Resolves the command path from process arguments, handling top-level aliases.
 *
 * Examples:
 * - ["node", "cli.js", "project", "init"] -> "project init"
 * - ["node", "cli.js", "init"] -> "project init" (via alias)
 * - ["node", "cli.js", "goal", "start", "--id", "123"] -> "goal start"
 */
function resolveCommandPath(
  argv: string[],
  commands: RegisteredCommand[]
): string | null {
  // Remove node and script path
  const args = argv.slice(ARGV.COMMAND_START_INDEX);

  if (args.length === 0) {
    return null;
  }

  // Filter out flags to get positional args
  const positionalArgs = args.filter(
    (arg) => !arg.startsWith(CLI_FLAGS.FLAG_PREFIX)
  );

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

  // Check if this is a single-segment top-level command (e.g., "repair")
  const topLevelCommand = commands.find((c) => c.path === firstArg);
  if (topLevelCommand) {
    return topLevelCommand.path;
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
  return null;
}
