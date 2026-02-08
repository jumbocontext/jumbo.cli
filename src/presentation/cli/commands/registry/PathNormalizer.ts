/**
 * Path Normalizer
 *
 * Handles both string "a b" and array ["a", "b"] command path formats.
 * Provides consistent normalization for command registry.
 */

/**
 * Normalize a command path to an array of parts
 *
 * @example
 * normalizePath("session start") → ["session", "start"]
 * normalizePath(["session", "start"]) → ["session", "start"]
 */
export function normalizePath(path: string | string[]): string[] {
  if (Array.isArray(path)) {
    return path;
  }

  // Split on whitespace and filter out empty strings
  return path.split(/\s+/).filter(part => part.length > 0);
}

/**
 * Convert a normalized path array back to a string
 *
 * @example
 * pathToString(["session", "start"]) → "session start"
 */
export function pathToString(path: string[]): string {
  return path.join(" ");
}

/**
 * Extract parent and subcommand from a path
 *
 * @example
 * extractParts("session start") → { parent: "session", subcommand: "start" }
 * extractParts(["session", "start"]) → { parent: "session", subcommand: "start" }
 */
export function extractParts(path: string | string[]): {
  parent: string;
  subcommand: string;
} {
  const normalized = normalizePath(path);
  if (normalized.length !== 2) {
    throw new Error(
      `Invalid command path: expected 2 parts (parent subcommand), got ${normalized.length}: ${pathToString(normalized)}`
    );
  }

  return {
    parent: normalized[0],
    subcommand: normalized[1],
  };
}

/**
 * Validate that a path has exactly 2 parts
 */
export function isValidCommandPath(path: string | string[]): boolean {
  try {
    const normalized = normalizePath(path);
    return normalized.length === 2;
  } catch {
    return false;
  }
}
