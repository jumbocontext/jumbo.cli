import { describe, expect, it } from "@jest/globals";
import type { CockpitDaemonSnapshot } from "../../../../src/presentation/tui/cockpit/CockpitDaemonSnapshot.js";
import { getDaemonPanelStatusLabel } from "../../../../src/presentation/tui/cockpit/DaemonPanelStatusLabel.js";
import type { IDaemonConstants } from "../../../../src/presentation/tui/cockpit/daemons/IDaemonConstants.js";
import { TuiDaemonEventStatus } from "../../../../src/presentation/tui/daemon-subprocesses/TuiDaemonEventStatus.js";
import { TuiSubprocessStatus } from "../../../../src/presentation/tui/daemon-subprocesses/TuiSubprocessStatus.js";

describe("getDaemonPanelStatusLabel", () => {
  it("uses the daemon idle verb when the running daemon latest event is idle", () => {
    expect(getDaemonPanelStatusLabel(snapshot({
      status: TuiSubprocessStatus.RUNNING,
      eventStatuses: [
        TuiDaemonEventStatus.PROCESSING,
        TuiDaemonEventStatus.IDLE,
      ],
    }), daemonConstants)).toBe("[ idle ]");
  });

  it("uses the daemon active verb when the running daemon latest event is not idle", () => {
    expect(getDaemonPanelStatusLabel(snapshot({
      status: TuiSubprocessStatus.RUNNING,
      eventStatuses: [TuiDaemonEventStatus.PROCESSING],
    }), daemonConstants)).toBe("[ active ]");
  });

  it("uses the daemon active verb when the running daemon has no events", () => {
    expect(getDaemonPanelStatusLabel(snapshot({
      status: TuiSubprocessStatus.RUNNING,
      eventStatuses: [],
    }), daemonConstants)).toBe("[ active ]");
  });

  it("uses the subprocess status when the daemon is not running", () => {
    expect(getDaemonPanelStatusLabel(snapshot({
      status: TuiSubprocessStatus.STOPPED,
      eventStatuses: [TuiDaemonEventStatus.IDLE],
    }), daemonConstants)).toBe("[ stopped ]");
  });
});

const daemonConstants: IDaemonConstants = {
  name: "Reviewer",
  title: "Reviewer daemon",
  activeVerb: "active",
  idleVerb: "idle",
  info: {
    title: "Reviewer info",
    lines: [],
  },
};

function snapshot({
  status,
  eventStatuses,
}: {
  readonly status: CockpitDaemonSnapshot["status"];
  readonly eventStatuses: readonly string[];
}): CockpitDaemonSnapshot {
  return {
    status,
    events: eventStatuses.map((eventStatus) => ({ status: eventStatus })),
  };
}
