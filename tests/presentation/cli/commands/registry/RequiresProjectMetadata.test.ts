import { describe, it, expect } from "@jest/globals";
import { commands } from "../../../../../src/presentation/cli/commands/registry/generated-commands.js";

/**
 * The bootstrap-layer guard treats command metadata as the single source of
 * truth for whether a command may run outside an initialized Jumbo project.
 * Every registered command must therefore declare requiresProject explicitly,
 * and only an explicit allow-list may opt out of project enforcement.
 */
const REQUIRES_PROJECT_FALSE_ALLOWLIST: ReadonlySet<string> = new Set([
  "project init",
]);

describe("requiresProject metadata", () => {
  it("every registered command declares requiresProject as a boolean", () => {
    const offenders = commands.filter(
      (c) => typeof c.metadata.requiresProject !== "boolean"
    );
    expect(offenders.map((c) => c.path)).toEqual([]);
  });

  it("only the explicit allow-list opts out of project enforcement", () => {
    const actualFalse = new Set(
      commands
        .filter((c) => c.metadata.requiresProject === false)
        .map((c) => c.path)
    );
    expect(actualFalse).toEqual(REQUIRES_PROJECT_FALSE_ALLOWLIST);
  });
});
