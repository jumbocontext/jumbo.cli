/**
 * Style Configuration
 *
 * Centralized configuration for colors, symbols, emojis, and spacing.
 * This is the primary tinkering point for customizing CLI output appearance.
 */

import chalk from "chalk";

/**
 * Color palette for different message types
 */
export const Colors = {
  // Primary colors
  primary: chalk.rgb(235, 235, 235),
  secondary: chalk.gray,
  accent: chalk.rgb(64, 200, 200),
  headline: chalk.rgb(240, 192, 64),

  // Status colors
  success: chalk.rgb(64, 200, 64),
  error: chalk.rgb(229, 64, 64),
  warning: chalk.rgb(240, 192, 64),
  info: chalk.rgb(200, 192, 160),

  // Text styles
  muted: chalk.gray,
  bold: chalk.bold,
  dim: chalk.dim,

  // Special
  brand: chalk.rgb(64, 200, 200),
  highlight: chalk.rgb(64, 128, 240),
} as const;

/**
 * Symbols for different message types
 * Can swap between emoji and ASCII based on environment
 */
export const Symbols = {
  // Use emojis by default, fallback to ASCII if needed
  success: process.stdout.isTTY ? "✅" : "[OK]",
  error: process.stdout.isTTY ? "❌" : "[ERROR]",
  warning: process.stdout.isTTY ? "⚠️" : "[WARN]",
  info: process.stdout.isTTY ? "ℹ️" : "[INFO]",
  arrow: process.stdout.isTTY ? "→" : "->",
  bullet: process.stdout.isTTY ? "•" : "*",
  check: process.stdout.isTTY ? "✓" : "[x]",
  cross: process.stdout.isTTY ? "✗" : "[ ]",
  ellipsis: "...",
} as const;

/**
 * Layout configuration
 */
export const Layout = {
  // Indentation
  indent: "  ",
  doubleIndent: "    ",

  // Spacing
  sectionSpacing: "\n",
  itemSpacing: "\n",

  // Width limits
  maxWidth: 80,

  // Padding
  padding: {
    small: 1,
    medium: 2,
    large: 4,
  },
} as const;

/**
 * Message templates for common patterns
 */
export const Templates = {
  /**
   * Format a key-value pair
   */
  keyValue: (key: string, value: string, indent = 0): string => {
    const prefix = Layout.indent.repeat(indent);
    return `${prefix}${Colors.muted(key + ":")} ${value}`;
  },

  /**
   * Format a section header
   */
  sectionHeader: (title: string): string => {
    return `\n${Colors.bold(title)}\n`;
  },

  /**
   * Format a list item
   */
  listItem: (text: string, indent = 0): string => {
    const prefix = Layout.indent.repeat(indent);
    return `${prefix}${Colors.muted(Symbols.bullet)} ${text}`;
  },

  /**
   * Format an error message
   */
  errorMessage: (message: string, details?: string): string => {
    let output = `${Symbols.error} ${Colors.error(message)}`;
    if (details) {
      output += `\n${Layout.indent}${Colors.muted(details)}`;
    }
    return output;
  },

  /**
   * Format a success message
   */
  successMessage: (message: string, details?: string): string => {
    let output = `${Symbols.success} ${Colors.success(message)}`;
    if (details) {
      output += `\n${Layout.indent}${Colors.muted(details)}`;
    }
    return output;
  },
} as const;

/**
 * Helper to strip ANSI codes for length calculations
 */
export function stripAnsi(str: string): string {
  const ansiRegex = /\x1B\[[0-?]*[ -/]*[@-~]/g;
  return str.replace(ansiRegex, "");
}

/**
 * Helper to get visual length of a string (without ANSI codes)
 */
export function visualLength(str: string): number {
  return stripAnsi(str).length;
}

/**
 * Helper to center text within a given width
 */
export function centerText(text: string, width: number): string {
  const len = visualLength(text);
  if (len >= width) return text;
  const leftPad = Math.floor((width - len) / 2);
  const rightPad = width - len - leftPad;
  return " ".repeat(leftPad) + text + " ".repeat(rightPad);
}

/**
 * Helper to truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  const len = visualLength(text);
  if (len <= maxLength) return text;
  return stripAnsi(text).substring(0, maxLength - 3) + Symbols.ellipsis;
}
