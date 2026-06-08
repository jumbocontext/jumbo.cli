import { describe, expect, it } from "@jest/globals";
import { TuiSubprocessStatus, type TuiSubprocessStatusValue } from "../../../../src/presentation/tui/daemon-subprocesses/TuiSubprocessStatus.js";

describe("TuiSubprocessStatus", () => {
  it("defines the lifecycle values consumed by subprocess snapshots", () => {
    expect(TuiSubprocessStatus).toEqual({
      STOPPED: "stopped",
      RUNNING: "running",
      STOPPING: "stopping",
      FAILED: "failed",
    });
  });

  it("types status values from its own runtime set", () => {
    const status: TuiSubprocessStatusValue = "running";
    expect(TuiSubprocessStatus).toHaveProperty(status.toUpperCase(), status);
  });
});
