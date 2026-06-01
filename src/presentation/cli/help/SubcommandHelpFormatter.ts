/**
 * Subcommand Help Formatter
 *
 * Formats individual subcommand help in gh CLI style.
 * Produces: description, USAGE, FLAGS, INHERITED FLAGS, EXAMPLES, LEARN MORE.
 */

import { RegisteredCommand, CommandOption, CommandExample } from "../commands/registry/CommandMetadata.js";
import { normalizePath } from "../commands/registry/PathNormalizer.js";

/** Indent for flag lines (2 spaces, matching gh style). */
const FLAG_INDENT = "  ";

/** Minimum gap between flag text and description. */
const MIN_GAP = 2;

/**
 * Compute the pad width for a set of flags so descriptions align.
 * Returns the length the flag text should be padded to (after the indent).
 */
function computePadWidth(allOptions: CommandOption[]): number {
  const longest = allOptions
    .filter(opt => !opt.hidden)
    .reduce((max, opt) => Math.max(max, opt.flags.length), 0);
  return longest + MIN_GAP;
}

/**
 * Format a single flag line with alignment.
 */
function formatFlagLine(flags: string, description: string, padWidth: number): string {
  const padded = flags.padEnd(padWidth);
  return `${FLAG_INDENT}${padded}${description}`;
}

/**
 * Format flags from CommandOption[] into aligned lines.
 */
function formatFlags(options: CommandOption[], required: boolean, padWidth: number): string[] {
  return options
    .filter(opt => !opt.hidden)
    .map(opt => {
      let desc = opt.description;
      if (required) {
        desc += " (required)";
      }
      if (opt.default !== undefined) {
        desc += ` (default: ${opt.default})`;
      }
      return formatFlagLine(opt.flags, desc, padWidth);
    });
}

/**
 * Format examples in gh style: # comment + $ command pairs.
 */
function formatExamples(examples: CommandExample[]): string[] {
  const lines: string[] = [];
  for (let i = 0; i < examples.length; i++) {
    if (i > 0) lines.push("");
    lines.push(`  # ${examples[i].description}`);
    lines.push(`  $ ${examples[i].command}`);
  }
  return lines;
}

/**
 * Format gh-style help for a subcommand.
 *
 * @param registeredCommand - The command's metadata and path
 * @param aliasName - If rendering help for an alias, the alias name (replaces path in USAGE)
 */
export function formatSubcommandHelp(
  registeredCommand: RegisteredCommand,
  aliasName?: string
): string {
  const metadata = registeredCommand.metadata;
  const commandName = aliasName ?? normalizePath(registeredCommand.path).join(" ");

  // Compute consistent pad width across all flags (including --help)
  const allOptions: CommandOption[] = [
    ...(metadata.requiredOptions ?? []),
    ...(metadata.options ?? []),
    { flags: "--help", description: "" },
  ];
  const padWidth = computePadWidth(allOptions);

  const sections: string[] = [];

  // Description (plain text, no header)
  sections.push(metadata.description + "\n");

  // USAGE
  sections.push(`USAGE\n  jumbo ${commandName} [flags]`);

  // FLAGS (required + optional combined)
  const requiredFlags = formatFlags(metadata.requiredOptions ?? [], true, padWidth);
  const optionalFlags = formatFlags(metadata.options ?? [], false, padWidth);
  const allFlags = [...requiredFlags, ...optionalFlags];

  if (allFlags.length > 0) {
    sections.push("FLAGS\n" + allFlags.join("\n"));
  }

  // INHERITED FLAGS
  sections.push("INHERITED FLAGS\n" + formatFlagLine("--help", "Show help for command", padWidth));

  // EXAMPLES
  if (metadata.examples && metadata.examples.length > 0) {
    sections.push("EXAMPLES\n" + formatExamples(metadata.examples).join("\n"));
  }

  // LEARN MORE
  const learnMoreLines = [
    "  Use `jumbo <command> --help` for more information about a command.",
  ];
  if (metadata.related && metadata.related.length > 0) {
    learnMoreLines.push(
      "  Related: " + metadata.related.map(cmd => `jumbo ${cmd}`).join(", ")
    );
  }
  sections.push("LEARN MORE\n" + learnMoreLines.join("\n"));

  return "\n" + sections.join("\n\n") + "\n";
}
