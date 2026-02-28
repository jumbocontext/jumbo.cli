/**
 * Category-Based Help Formatter
 *
 * Formats command help output in gh-style with hierarchical grouping.
 * Categories, generous whitespace, and clean alignment.
 */

import { RegisteredCommand } from "../commands/registry/CommandMetadata.js";
import type { CommandCategory } from "../commands/registry/CommandMetadata.js";

/**
 * Category display configuration
 */
const CATEGORY_LABELS: Record<CommandCategory, string> = {
  "host": "HOST",
  "project-knowledge": "PROJECT",
  "work": "WORK",
  "solution": "SOLUTION",
  "relations": "GRAPH",
};

/**
 * Category display order (controls section ordering in help)
 */
const CATEGORY_ORDER: CommandCategory[] = [
  "host",
  "project-knowledge",
  "work",
  "solution",
  "relations",
];

/**
 * Group commands by category
 */
function groupByCategory(commands: RegisteredCommand[]): Map<CommandCategory | "uncategorized", RegisteredCommand[]> {
  const grouped = new Map<CommandCategory | "uncategorized", RegisteredCommand[]>();

  for (const command of commands) {
    const category = command.metadata.category || "uncategorized";
    if (!grouped.has(category)) {
      grouped.set(category, []);
    }
    grouped.get(category)!.push(command);
  }

  return grouped;
}

/**
 * Fixed column where descriptions start (0-indexed)
 * This ensures consistent alignment across all categories
 */
const DESCRIPTION_START_COLUMN = 26;

/**
 * Format a single command line with alignment
 * Descriptions always start at column 26 for consistent alignment
 */
function formatCommandLine(path: string, description: string): string {
  // 2 spaces indent + path padded to fill remaining space before description column
  const paddedPath = path.padEnd(DESCRIPTION_START_COLUMN - 2);
  return `  ${paddedPath}${description}`;
}

/**
 * Format commands in a category
 */
function formatCategory(category: CommandCategory | "uncategorized", commands: RegisteredCommand[]): string {
  // Sort commands alphabetically by path
  const sorted = [...commands].sort((a, b) => a.path.localeCompare(b.path));

  // Build output
  const lines: string[] = [];

  // Category header (ALL CAPS, no indentation)
  const header = category === "uncategorized" ? "OTHER COMMANDS" : CATEGORY_LABELS[category];
  lines.push(header);

  // Command list
  for (const command of sorted) {
    lines.push(formatCommandLine(command.path, command.metadata.description));
  }

  return lines.join("\n");
}

/**
 * Format all commands grouped by category (gh-style)
 */
export function formatCategorizedCommands(commands: RegisteredCommand[]): string {
  const visible = commands.filter(c => !c.metadata.hidden);
  const grouped = groupByCategory(visible);
  const sections: string[] = [];

  // Add categories in defined order
  for (const category of CATEGORY_ORDER) {
    const categoryCommands = grouped.get(category);
    if (categoryCommands && categoryCommands.length > 0) {
      sections.push(formatCategory(category, categoryCommands));
    }
  }

  // Add uncategorized commands at the end (if any)
  const uncategorized = grouped.get("uncategorized");
  if (uncategorized && uncategorized.length > 0) {
    sections.push(formatCategory("uncategorized", uncategorized));
  }

  // Join sections with generous whitespace (blank line between sections)
  return sections.join("\n\n");
}
