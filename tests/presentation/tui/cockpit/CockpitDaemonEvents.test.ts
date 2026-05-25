import { describe, expect, it } from "@jest/globals";
import {
  appendDaemonEventRows,
  findDaemonStatus,
  formatDaemonEventRow,
  getDaemonEventRows,
} from "../../../../src/presentation/tui/cockpit/CockpitDaemonEvents.js";
import type { TuiSubprocessSnapshot } from "../../../../src/presentation/tui/daemon-subprocesses/ISubprocessManager.js";
import { DEFAULT_WORKER_DAEMON_CONFIG } from "../../../../src/application/daemons/WorkerDaemonCatalog.js";

describe("CockpitDaemonEvents", () => {
  it("returns default stopped snapshots for missing daemon statuses", () => {
    expect(findDaemonStatus([], "refiner")).toEqual({
      name: "refiner",
      status: "stopped",
      config: DEFAULT_WORKER_DAEMON_CONFIG,
      stdout: [],
      stderr: [],
      events: [],
    });
  });

  it("formats daemon event rows with source, category, goal, attempt, and exit details", () => {
    const rows = getDaemonEventRows([
      {
        name: "reviewer",
        status: "running",
        config: DEFAULT_WORKER_DAEMON_CONFIG,
        stdout: [],
        stderr: [],
        events: [{
          daemon: "reviewer",
          source: "agent",
          category: "retry",
          status: "processing",
          message: "review failed",
          goalId: "goal_123456789",
          attempt: 2,
          maxRetries: 3,
          exitCode: 1,
          timestampMs: 1767272400000,
        }],
      },
    ], 1767272400500);

    expect(rows).toHaveLength(1);
    expect(formatDaemonEventRow(rows[0])).toContain("agent");
    expect(formatDaemonEventRow(rows[0])).toContain("retry");
    expect(formatDaemonEventRow(rows[0])).toContain("review failed goal_123 2/3 exit 1");
  });

  it("appends unseen rows and keeps newest rows first", () => {
    const current = getDaemonEventRows([
      snapshot("refiner", "old", 1000),
    ], 1000);
    const next = getDaemonEventRows([
      snapshot("refiner", "new", 2000),
    ], 2000);

    expect(appendDaemonEventRows(current, next).map((row) => row.message)).toEqual(["new", "old"]);
  });
});

function snapshot(
  name: "refiner",
  message: string,
  timestampMs: number,
): TuiSubprocessSnapshot {
  return {
    name,
    status: "running",
    config: DEFAULT_WORKER_DAEMON_CONFIG,
    stdout: [],
    stderr: [],
    events: [{
      daemon: name,
      status: "processing",
      message,
      timestampMs,
    }],
  };
}
