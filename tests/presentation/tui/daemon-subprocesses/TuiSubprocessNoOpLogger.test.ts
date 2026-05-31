import { describe, expect, it } from "@jest/globals";
import { TuiSubprocessNoOpLogger } from "../../../../src/presentation/tui/daemon-subprocesses/TuiSubprocessNoOpLogger.js";

describe("TuiSubprocessNoOpLogger", () => {
  it("provides the ILogger methods used by subprocess orchestration without side effects", () => {
    expect(() => {
      TuiSubprocessNoOpLogger.error("error");
      TuiSubprocessNoOpLogger.warn("warn");
      TuiSubprocessNoOpLogger.info("info");
      TuiSubprocessNoOpLogger.debug("debug");
    }).not.toThrow();
  });
});
