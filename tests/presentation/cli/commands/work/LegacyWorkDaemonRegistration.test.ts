import { describe, expect, it } from "@jest/globals";
import { commands } from "../../../../../src/presentation/cli/commands/registry/generated-commands.js";

describe("legacy work daemon command registration", () => {
  it("keeps work refine and work review command surfaces registered until TUI replacements are equivalent", () => {
    const commandPaths = commands.map((command) => command.path);

    expect(commandPaths).toContain("work refine");
    expect(commandPaths).toContain("work review");
  });
});
