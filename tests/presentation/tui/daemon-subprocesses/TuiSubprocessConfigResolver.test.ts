import { describe, expect, it } from "@jest/globals";
import { TuiSubprocessConfigResolver } from "../../../../src/presentation/tui/daemon-subprocesses/TuiSubprocessConfigResolver.js";

describe("TuiSubprocessConfigResolver", () => {
  it("fills unspecified runtime settings from the worker daemon defaults", () => {
    const resolver = new TuiSubprocessConfigResolver();

    expect(resolver.resolve({ agentId: "claude" })).toEqual({
      agentId: "claude",
      pollIntervalMs: 30000,
      maxRetries: 3,
    });
  });
});
