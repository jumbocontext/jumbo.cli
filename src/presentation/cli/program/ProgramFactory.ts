/**
 * Program Factory
 *
 * Creates and configures the Commander.js program instance.
 * Centralizes CLI structure: name, version, usage, and help formatting.
 */

import { Command } from "commander";
import { RegisteredCommand } from "../commands/registry/CommandMetadata.js";
import { formatCategorizedCommands } from "../help/CategoryFormatter.js";

/**
 * Creates a configured Commander program instance.
 *
 * @param version - CLI version string
 * @param commands - Registered commands for categorized help
 * @returns Configured Commander program
 */
export function createProgram(
  version: string,
  commands: RegisteredCommand[]
): Command {
  const program = new Command();

  program
    .name("jumbo")
    .version(version)
    .usage("<command> <subcommand> [flags]")
    .configureHelp({
      // Align option descriptions to start at column 26 (matching command descriptions)
      // Formula: 2 (indent) + padWidth + 2 (gap) = 26, so padWidth = 22
      padWidth: () => 22,
    });

  // Override help to show categorized commands (gh-style)
  const originalHelp = program.helpInformation.bind(program);
  program.helpInformation = function () {
    // Get original help and capitalize section headers
    let help = originalHelp().replace(/^Options:/gm, "OPTIONS:");

    // Replace the default "Commands:" section with categorized version
    const commandsRegex = /^Commands:[\s\S]*$/m;
    const match = help.match(commandsRegex);

    if (match) {
      // Generate categorized commands section
      const categorizedCommands = formatCategorizedCommands(commands);

      // Replace entire Commands section with our categorized version
      help = help.replace(commandsRegex, categorizedCommands);
    }

    return help + "\n\n";
  };

  return program;
}
