/**
 * CLI Constants
 *
 * Shared constants for the CLI presentation layer.
 * Single source of truth to prevent magic strings and numbers.
 */

/**
 * CLI flag names
 */
export const CLI_FLAGS = {
  HELP_LONG: "--help",
  HELP_SHORT: "-h",
  VERSION_LONG: "--version",
  VERSION_SHORT: "-v",
  FLAG_PREFIX: "-",
} as const;

/**
 * argv structure constants
 */
export const ARGV = {
  /** argv[0]=node, argv[1]=script */
  NODE_AND_SCRIPT_ARG_COUNT: 2,
  /** node + script + single argument */
  ROOT_COMMAND_ARG_COUNT: 3,
  /** Skip node and script path when parsing commands */
  COMMAND_START_INDEX: 2,
} as const;

/**
 * Process exit codes
 */
export const SUCCESS_EXIT_CODE = 0;
export const FAILURE_EXIT_CODE = 1;
