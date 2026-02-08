/**
 * Global Options Handler
 *
 * Attaches global CLI options and configures the Renderer based on user flags.
 * Handles --format, --quiet, and --verbose options.
 */

import { Command } from "commander";
import { Renderer } from "../rendering/Renderer.js";
import { OutputFormat, VerbosityLevel } from "../rendering/types.js";

/**
 * Attaches global options to the program and configures the Renderer
 * via a preAction hook.
 *
 * Global options:
 * - --format <format>: Output format (text, json, yaml, ndjson)
 * - --quiet: Minimal output (suppress info messages)
 * - --verbose: Verbose output (show detailed info)
 *
 * @param program - Commander program instance
 */
export function attachGlobalOptions(program: Command): void {
  program
    .option(
      "--format <format>",
      "Output format: text, json, yaml, ndjson (default: auto-detect)"
    )
    .option("--quiet", "Minimal output (suppress info messages)")
    .option("--verbose", "Verbose output (show detailed info)")
    .hook("preAction", (thisCommand) => {
      configureRendererFromOptions(thisCommand);
    });
}

/**
 * Configures the Renderer singleton based on command options.
 *
 * @param command - The command with parsed options
 */
function configureRendererFromOptions(command: Command): void {
  const opts = command.opts();

  // Determine verbosity
  let verbosity: VerbosityLevel = "normal";
  if (opts.quiet) verbosity = "quiet";
  else if (opts.verbose) verbosity = "verbose";

  // Determine format
  const format = opts.format as OutputFormat | undefined;

  // Configure renderer singleton
  Renderer.configure({ format, verbosity });
}
