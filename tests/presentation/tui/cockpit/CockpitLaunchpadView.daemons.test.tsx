import React from "react";
import { jest, describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { CockpitLaunchpadView } from "../../../../src/presentation/tui/cockpit/CockpitLaunchpadView.js";
import { SubprocessManagerProvider } from "../../../../src/presentation/tui/daemon-subprocesses/SubprocessManagerContext.js";
import type { ISubprocessManager, TuiDaemonConfig, TuiDaemonName, TuiSubprocessSnapshot } from "../../../../src/presentation/tui/daemon-subprocesses/ISubprocessManager.js";

const tick = () => new Promise((resolve) => setTimeout(resolve, 50));
const pollTick = () => new Promise((resolve) => setTimeout(resolve, 550));
const defaultConfig = {
  agentId: "codex",
  pollIntervalMs: 30000,
  maxRetries: 3,
};
const eventTimestampMs = new Date(2099, 0, 1, 12, 0, 0).getTime();
const laterEventTimestampMs = new Date(2099, 0, 1, 12, 0, 1).getTime();

function createSnapshots(config: TuiDaemonConfig = defaultConfig): Map<TuiDaemonName, TuiSubprocessSnapshot> {
  return new Map<TuiDaemonName, TuiSubprocessSnapshot>([
    ["reviewer", { name: "reviewer", status: "stopped", config, stdout: [], stderr: [], events: [] }],
    ["refiner", { name: "refiner", status: "stopped", config, stdout: [], stderr: [], events: [] }],
    ["codifier", { name: "codifier", status: "stopped", config, stdout: [], stderr: [], events: [] }],
  ]);
}

function renderedTextPosition(frame: string, text: string): number {
  const position = frame.indexOf(text);

  if (position !== -1) {
    return position;
  }

  return frame.indexOf(text.slice(1));
}

describe("CockpitLaunchpadView daemon controls", () => {
  it("starts and stops real daemon targets through ISubprocessManager without replacing launchpad panels", async () => {
    const snapshots = createSnapshots();
    const manager: ISubprocessManager = {
      spawn: jest.fn(async (name: TuiDaemonName, config = defaultConfig) => {
        const next = {
          name,
          status: "running" as const,
          config: { ...defaultConfig, ...config },
          pid: 123,
          stdout: ["{\"daemon\":\"refiner\",\"status\":\"processing\",\"goalId\":\"goal_123456\",\"attempt\":1,\"maxRetries\":3}"],
          stderr: [],
          events: [{ daemon: "refiner", status: "processing", timestampMs: eventTimestampMs, goalId: "goal_123456", attempt: 1, maxRetries: 3 }],
        };
        snapshots.set(name, next);
        return next;
      }),
      terminate: jest.fn(async (name: TuiDaemonName) => {
        const next = { name, status: "stopped" as const, config: defaultConfig, stdout: ["stopped"], stderr: [], events: [] };
        snapshots.set(name, next);
        return next;
      }),
      terminateAll: jest.fn(async () => {}),
      getStatus: jest.fn((name: TuiDaemonName) => snapshots.get(name)!),
      getAllStatuses: jest.fn(() => Array.from(snapshots.values())),
    };

    const { lastFrame, stdin, unmount } = render(
      <SubprocessManagerProvider manager={manager}>
        <CockpitLaunchpadView
          reviewerFrameDurationMs={0}
          refinerFrameDurationMs={0}
          codifierFrameDurationMs={0}
        />
      </SubprocessManagerProvider>,
    );

    expect(lastFrame()).toContain("COCKPIT//");
    expect(lastFrame()).toContain("EVENTS//");
    expect(lastFrame()).toContain("time     source   category");
    expect(lastFrame()).not.toContain("SESSION//");
    expect(lastFrame()).not.toContain("PROJECT//");
    expect(lastFrame()).toContain("REVIEWER//");
    expect(lastFrame()).toContain("CODIFIER//");
    expect(lastFrame()).not.toContain("╭");
    expect(lastFrame()).not.toContain("╯");
    expect(lastFrame()).toContain("•");
    expect(lastFrame()).toMatch(/[◇◆□■△▽○]/);
    expect(lastFrame()).toMatch(/[A-Z0-9]{4}\./);
    expect(renderedTextPosition(lastFrame() ?? "", "[s] start")).toBeGreaterThanOrEqual(0);
    expect(lastFrame()).not.toContain("[r] focus");
    expect(lastFrame()).not.toContain("[v] focus");
    expect(lastFrame()).not.toContain("[c] focus");
    expect(lastFrame()).toContain("[i] info");
    expect(lastFrame()).toContain("[@] config");
    expect(lastFrame()).toContain("[ stopped ]");
    expect(lastFrame()).not.toContain("[a] codex [p] 30s [x] 3");

    const frame = lastFrame() ?? "";
    const refinerPosition = renderedTextPosition(frame, "REFINER//");
    const reviewerPosition = renderedTextPosition(frame, "REVIEWER//");
    const codifierPosition = renderedTextPosition(frame, "CODIFIER//");
    expect(refinerPosition).toBeGreaterThanOrEqual(0);
    expect(refinerPosition).toBeLessThan(reviewerPosition);
    expect(reviewerPosition).toBeLessThan(codifierPosition);

    stdin.write("s");
    await tick();
    expect(manager.spawn).toHaveBeenCalledWith("refiner", defaultConfig);
    expect(renderedTextPosition(lastFrame() ?? "", "REFINER//")).toBeGreaterThanOrEqual(0);
    expect(lastFrame()).not.toContain("REFINER// (running)");
    expect(lastFrame()).toContain("[ refining ]");
    expect(lastFrame()).toContain("•");
    expect(lastFrame()).not.toContain("refining goal_123");
    expect(renderedTextPosition(lastFrame() ?? "", "12:00:00 refiner  processing   goal_123 1/3")).toBeGreaterThanOrEqual(0);

    stdin.write("s");
    await tick();
    expect(manager.terminate).toHaveBeenCalledWith("refiner");
    expect(lastFrame()).toContain("[ stopped ]");

    stdin.write("\t");
    await tick();
    stdin.write("s");
    await tick();
    expect(manager.spawn).toHaveBeenCalledWith("reviewer", defaultConfig);

    stdin.write("\t");
    await tick();
    stdin.write("s");
    await tick();
    expect(manager.spawn).toHaveBeenCalledWith("codifier", defaultConfig);
    unmount();
  });

  it("renders static daemon glyph grids for stopped daemons", () => {
    const { lastFrame, unmount } = render(
      <CockpitLaunchpadView
        reviewerFrameDurationMs={0}
        refinerFrameDurationMs={0}
        codifierFrameDurationMs={0}
      />,
    );

    expect(lastFrame()).toContain("•");
    expect(lastFrame()).toMatch(/[◇◆□■△▽○]/);
    expect(lastFrame()).toMatch(/[A-Z0-9]{4}\./);
    unmount();
  });

  it("uses animated frame indexes only for daemons that are running", () => {
    const snapshots = createSnapshots();
    snapshots.set("reviewer", {
      name: "reviewer",
      status: "running",
      config: defaultConfig,
      pid: 456,
      stdout: [],
      stderr: [],
      events: [],
    });
    const manager: ISubprocessManager = {
      spawn: jest.fn(async (name: TuiDaemonName) => snapshots.get(name)!),
      terminate: jest.fn(async (name: TuiDaemonName) => snapshots.get(name)!),
      terminateAll: jest.fn(async () => {}),
      getStatus: jest.fn((name: TuiDaemonName) => snapshots.get(name)!),
      getAllStatuses: jest.fn(() => Array.from(snapshots.values())),
    };

    const { lastFrame, unmount } = render(
      <SubprocessManagerProvider manager={manager}>
        <CockpitLaunchpadView
          reviewerFrameDurationMs={0}
          refinerFrameDurationMs={0}
          codifierFrameDurationMs={0}
        />
      </SubprocessManagerProvider>,
    );

    expect(lastFrame()).toMatch(/[◇◆□■△▽○]/);
    expect(lastFrame()).toContain("•");
    expect(lastFrame()).toMatch(/[A-Z0-9]{4}\./);
    unmount();
  });

  it("cycles focused daemon panels with tab, toggles focused daemon with s, and shows focused daemon info", async () => {
    const snapshots = createSnapshots();
    const manager: ISubprocessManager = {
      spawn: jest.fn(async (name: TuiDaemonName, config = defaultConfig) => {
        const next = { name, status: "running" as const, config: { ...defaultConfig, ...config }, pid: 123, stdout: [], stderr: [], events: [] };
        snapshots.set(name, next);
        return next;
      }),
      terminate: jest.fn(async (name: TuiDaemonName) => {
        const next = { name, status: "stopped" as const, config: defaultConfig, stdout: ["stopped"], stderr: [], events: [] };
        snapshots.set(name, next);
        return next;
      }),
      terminateAll: jest.fn(async () => {}),
      getStatus: jest.fn((name: TuiDaemonName) => snapshots.get(name)!),
      getAllStatuses: jest.fn(() => Array.from(snapshots.values())),
    };

    const { lastFrame, stdin, unmount } = render(
      <SubprocessManagerProvider manager={manager}>
        <CockpitLaunchpadView
          reviewerFrameDurationMs={0}
          refinerFrameDurationMs={0}
          codifierFrameDurationMs={0}
        />
      </SubprocessManagerProvider>,
    );

    expect(lastFrame()).toContain("selected refiner");

    stdin.write("\t");
    await tick();
    expect(lastFrame()).toContain("selected reviewer");

    stdin.write("s");
    await tick();
    expect(manager.spawn).toHaveBeenCalledWith("reviewer", defaultConfig);
    expect(lastFrame()).toContain("[ reviewing ]");

    stdin.write("i");
    await tick();
    expect(lastFrame()).toContain("REVIEWER// validates completed goal work");
    expect(lastFrame()).toContain("Runs the QA review loop for submitted goals.");
    expect(lastFrame()).toContain("open");

    stdin.write("\t");
    await tick();
    expect(lastFrame()).toContain("selected codifier");
    expect(lastFrame()).toContain("CODIFIER// reconciles approved work");

    stdin.write("s");
    await tick();
    expect(manager.spawn).toHaveBeenCalledWith("codifier", defaultConfig);
    expect(lastFrame()).toContain("[ codifying ]");
    unmount();
  });

  it("renders daemon event rows after subprocess snapshots update", async () => {
    const snapshots = createSnapshots();
    const manager: ISubprocessManager = {
      spawn: jest.fn(async (name: TuiDaemonName) => snapshots.get(name)!),
      terminate: jest.fn(async (name: TuiDaemonName) => snapshots.get(name)!),
      terminateAll: jest.fn(async () => {}),
      getStatus: jest.fn((name: TuiDaemonName) => snapshots.get(name)!),
      getAllStatuses: jest.fn(() => Array.from(snapshots.values())),
    };

    const { lastFrame, unmount } = render(
      <SubprocessManagerProvider manager={manager}>
        <CockpitLaunchpadView
          reviewerFrameDurationMs={0}
          refinerFrameDurationMs={0}
          codifierFrameDurationMs={0}
        />
      </SubprocessManagerProvider>,
    );

    expect(lastFrame()).not.toContain("reviewer idle");
    expect(lastFrame()).not.toContain("refiner  idle");
    expect(lastFrame()).not.toContain("codifier idle");

    snapshots.set("reviewer", {
      name: "reviewer",
      status: "running",
      config: defaultConfig,
      pid: 456,
      stdout: ["{\"daemon\":\"reviewer\",\"status\":\"completed\",\"goalId\":\"goal_reviewed\",\"attempt\":2,\"maxRetries\":3}"],
      stderr: [],
      events: [
        { daemon: "reviewer", status: "processing", timestampMs: eventTimestampMs, goalId: "goal_reviewed", attempt: 1, maxRetries: 3 },
        { daemon: "reviewer", status: "completed", timestampMs: laterEventTimestampMs, goalId: "goal_reviewed", attempt: 2, maxRetries: 3 },
      ],
    });
    snapshots.set("refiner", {
      name: "refiner",
      status: "failed",
      config: defaultConfig,
      stdout: [],
      stderr: ["agent refused task"],
      events: [],
      exitCode: 1,
    });
    snapshots.set("codifier", {
      name: "codifier",
      status: "running",
      config: defaultConfig,
      pid: 789,
      stdout: ["{\"daemon\":\"codifier\",\"status\":\"processing\",\"goalId\":\"goal_codify\",\"attempt\":1,\"maxRetries\":3}"],
      stderr: [],
      events: [
        { daemon: "codifier", status: "processing", timestampMs: eventTimestampMs, goalId: "goal_codify", attempt: 1, maxRetries: 3 },
      ],
    });

    await pollTick();

    expect(renderedTextPosition(lastFrame() ?? "", "12:00:00 reviewer processing   goal_rev 1/3")).toBeGreaterThanOrEqual(0);
    expect(renderedTextPosition(lastFrame() ?? "", "12:00:01 reviewer completed    goal_rev 2/3")).toBeGreaterThanOrEqual(0);
    expect(renderedTextPosition(lastFrame() ?? "", "12:00:00 codifier processing   goal_cod 1/3")).toBeGreaterThanOrEqual(0);
    unmount();
  });

  it("renders failed daemon lifecycle rows with stderr context", () => {
    const snapshots = createSnapshots();
    snapshots.set("refiner", {
      name: "refiner",
      status: "failed",
      config: defaultConfig,
      stdout: [],
      stderr: ["agent refused task"],
      events: [],
      exitCode: 1,
    });
    const manager: ISubprocessManager = {
      spawn: jest.fn(async (name: TuiDaemonName) => snapshots.get(name)!),
      terminate: jest.fn(async (name: TuiDaemonName) => snapshots.get(name)!),
      terminateAll: jest.fn(async () => {}),
      getStatus: jest.fn((name: TuiDaemonName) => snapshots.get(name)!),
      getAllStatuses: jest.fn(() => Array.from(snapshots.values())),
    };

    const { lastFrame, unmount } = render(
      <SubprocessManagerProvider manager={manager}>
        <CockpitLaunchpadView
          reviewerFrameDurationMs={0}
          refinerFrameDurationMs={0}
          codifierFrameDurationMs={0}
        />
      </SubprocessManagerProvider>,
    );

    expect(renderedTextPosition(lastFrame() ?? "", "refiner  failed")).toBeGreaterThanOrEqual(0);
    expect(renderedTextPosition(lastFrame() ?? "", "agent refused task")).toBeGreaterThanOrEqual(0);
    unmount();
  });

  it("keeps recent daemon events visible after later snapshots no longer include them", async () => {
    const snapshots = createSnapshots();
    const manager: ISubprocessManager = {
      spawn: jest.fn(async (name: TuiDaemonName) => snapshots.get(name)!),
      terminate: jest.fn(async (name: TuiDaemonName) => snapshots.get(name)!),
      terminateAll: jest.fn(async () => {}),
      getStatus: jest.fn((name: TuiDaemonName) => snapshots.get(name)!),
      getAllStatuses: jest.fn(() => Array.from(snapshots.values())),
    };

    const { lastFrame, unmount } = render(
      <SubprocessManagerProvider manager={manager}>
        <CockpitLaunchpadView
          reviewerFrameDurationMs={0}
          refinerFrameDurationMs={0}
          codifierFrameDurationMs={0}
        />
      </SubprocessManagerProvider>,
    );

    snapshots.set("reviewer", {
      name: "reviewer",
      status: "running",
      config: defaultConfig,
      pid: 456,
      stdout: [],
      stderr: [],
      events: [
        { daemon: "reviewer", status: "completed", timestampMs: laterEventTimestampMs, goalId: "goal_reviewed", attempt: 2, maxRetries: 3 },
      ],
    });

    await pollTick();
    expect(renderedTextPosition(lastFrame() ?? "", "12:00:01 reviewer completed    goal_rev 2/3")).toBeGreaterThanOrEqual(0);

    snapshots.set("reviewer", {
      name: "reviewer",
      status: "stopped",
      config: defaultConfig,
      stdout: [],
      stderr: [],
      events: [],
    });

    await pollTick();
    expect(renderedTextPosition(lastFrame() ?? "", "12:00:01 reviewer completed    goal_rev 2/3")).toBeGreaterThanOrEqual(0);
    unmount();
  });

  it("renders lifecycle, skipped, and exhausted statuses as event rows", () => {
    const snapshots = new Map<TuiDaemonName, TuiSubprocessSnapshot>([
      ["reviewer", {
        name: "reviewer",
        status: "running",
        config: defaultConfig,
        pid: 456,
        stdout: ["raw reviewer tail"],
        stderr: [],
        events: [],
      }],
      ["refiner", {
        name: "refiner",
        status: "running",
        config: defaultConfig,
        pid: 123,
        stdout: [],
        stderr: ["waiting for process exit"],
        events: [],
        stopRequested: true,
      }],
      ["codifier", {
        name: "codifier",
        status: "running",
        config: defaultConfig,
        pid: 789,
        stdout: [],
        stderr: [],
        events: [
          { daemon: "codifier", status: "skipped", timestampMs: eventTimestampMs, goalId: "goal_skip", maxRetries: 3 },
          { daemon: "codifier", status: "exhausted", timestampMs: laterEventTimestampMs, goalId: "goal_done", attempt: 3, maxRetries: 3 },
        ],
      }],
    ]);
    const manager: ISubprocessManager = {
      spawn: jest.fn(async (name: TuiDaemonName) => snapshots.get(name)!),
      terminate: jest.fn(async (name: TuiDaemonName) => snapshots.get(name)!),
      terminateAll: jest.fn(async () => {}),
      getStatus: jest.fn((name: TuiDaemonName) => snapshots.get(name)!),
      getAllStatuses: jest.fn(() => Array.from(snapshots.values())),
    };

    const { lastFrame, unmount } = render(
      <SubprocessManagerProvider manager={manager}>
        <CockpitLaunchpadView
          reviewerFrameDurationMs={0}
          refinerFrameDurationMs={0}
          codifierFrameDurationMs={0}
        />
      </SubprocessManagerProvider>,
    );

    expect(renderedTextPosition(lastFrame() ?? "", "reviewer starting")).toBeGreaterThanOrEqual(0);
    expect(renderedTextPosition(lastFrame() ?? "", "refiner  stopping")).toBeGreaterThanOrEqual(0);
    expect(renderedTextPosition(lastFrame() ?? "", "codifier skipped")).toBeGreaterThanOrEqual(0);
    expect(renderedTextPosition(lastFrame() ?? "", "goal_ski -/3")).toBeGreaterThanOrEqual(0);
    expect(renderedTextPosition(lastFrame() ?? "", "codifier exhausted")).toBeGreaterThanOrEqual(0);
    expect(renderedTextPosition(lastFrame() ?? "", "goal_don 3/3")).toBeGreaterThanOrEqual(0);
    unmount();
  });

  it("renders stopped daemon transition rows without showing initial stopped snapshots", () => {
    const snapshots = createSnapshots();
    snapshots.set("reviewer", {
      name: "reviewer",
      status: "stopped",
      config: defaultConfig,
      stdout: [],
      stderr: [],
      events: [],
      exitCode: 0,
      stopRequested: true,
    });
    const manager: ISubprocessManager = {
      spawn: jest.fn(async (name: TuiDaemonName) => snapshots.get(name)!),
      terminate: jest.fn(async (name: TuiDaemonName) => snapshots.get(name)!),
      terminateAll: jest.fn(async () => {}),
      getStatus: jest.fn((name: TuiDaemonName) => snapshots.get(name)!),
      getAllStatuses: jest.fn(() => Array.from(snapshots.values())),
    };

    const { lastFrame, unmount } = render(
      <SubprocessManagerProvider manager={manager}>
        <CockpitLaunchpadView
          reviewerFrameDurationMs={0}
          refinerFrameDurationMs={0}
          codifierFrameDurationMs={0}
        />
      </SubprocessManagerProvider>,
    );

    expect(renderedTextPosition(lastFrame() ?? "", "reviewer stopped")).toBeGreaterThanOrEqual(0);
    expect(renderedTextPosition(lastFrame() ?? "", "exit 0")).toBeGreaterThanOrEqual(0);
    expect(lastFrame()).not.toContain("refiner  stopped");
    expect(lastFrame()).not.toContain("codifier stopped");
    unmount();
  });

  it("does not duplicate synthetic starting events across snapshot polls", async () => {
    const snapshots = createSnapshots();
    snapshots.set("reviewer", {
      name: "reviewer",
      status: "running",
      config: defaultConfig,
      pid: 456,
      stdout: [],
      stderr: [],
      events: [],
    });
    const manager: ISubprocessManager = {
      spawn: jest.fn(async (name: TuiDaemonName) => snapshots.get(name)!),
      terminate: jest.fn(async (name: TuiDaemonName) => snapshots.get(name)!),
      terminateAll: jest.fn(async () => {}),
      getStatus: jest.fn((name: TuiDaemonName) => snapshots.get(name)!),
      getAllStatuses: jest.fn(() => Array.from(snapshots.values())),
    };

    const { lastFrame, unmount } = render(
      <SubprocessManagerProvider manager={manager}>
        <CockpitLaunchpadView
          reviewerFrameDurationMs={0}
          refinerFrameDurationMs={0}
          codifierFrameDurationMs={0}
        />
      </SubprocessManagerProvider>,
    );

    await pollTick();
    await pollTick();

    const frame = lastFrame() ?? "";
    expect(frame.match(/reviewer starting/g)).toHaveLength(1);
    unmount();
  });

  it("renders idle polling events and refiner foraging activity in the Events panel", async () => {
    const snapshots = createSnapshots();
    snapshots.set("reviewer", {
      name: "reviewer",
      status: "running",
      config: defaultConfig,
      pid: 456,
      stdout: [],
      stderr: [],
      events: [
        { daemon: "reviewer", status: "idle", timestampMs: eventTimestampMs },
        { daemon: "reviewer", status: "processing", timestampMs: laterEventTimestampMs, goalId: "goal_reviewed", attempt: 1, maxRetries: 3 },
      ],
    });
    snapshots.set("refiner", {
      name: "refiner",
      status: "running",
      config: defaultConfig,
      pid: 123,
      stdout: [],
      stderr: [],
      events: [
        {
          daemon: "refiner",
          status: "idle",
          source: "refiner",
          category: "foraging",
          message: "foraging for defined goals",
          timestampMs: eventTimestampMs,
        },
      ],
    });
    const manager: ISubprocessManager = {
      spawn: jest.fn(async (name: TuiDaemonName) => snapshots.get(name)!),
      terminate: jest.fn(async (name: TuiDaemonName) => snapshots.get(name)!),
      terminateAll: jest.fn(async () => {}),
      getStatus: jest.fn((name: TuiDaemonName) => snapshots.get(name)!),
      getAllStatuses: jest.fn(() => Array.from(snapshots.values())),
    };

    const { lastFrame, unmount } = render(
      <SubprocessManagerProvider manager={manager}>
        <CockpitLaunchpadView
          reviewerFrameDurationMs={0}
          refinerFrameDurationMs={0}
          codifierFrameDurationMs={0}
        />
      </SubprocessManagerProvider>,
    );

    await tick();

    expect(lastFrame()).toContain("[ foraging ]");
    expect(renderedTextPosition(lastFrame() ?? "", "12:00:00 reviewer idle")).toBeGreaterThanOrEqual(0);
    expect(renderedTextPosition(lastFrame() ?? "", "12:00:00 refiner  foraging")).toBeGreaterThanOrEqual(0);
    expect(lastFrame()).toContain("foraging for defined goals");
    expect(renderedTextPosition(lastFrame() ?? "", "12:00:01 reviewer processing   goal_rev 1/3")).toBeGreaterThanOrEqual(0);
    unmount();
  });

  it("renders normalized source, category, and message fields when daemon events provide them", async () => {
    const snapshots = createSnapshots();
    snapshots.set("reviewer", {
      name: "reviewer",
      status: "running",
      config: defaultConfig,
      pid: 456,
      stdout: [],
      stderr: [],
      events: [
        {
          daemon: "reviewer",
          status: "processing",
          source: "agent",
          category: "retry",
          message: "retrying review after non-zero agent exit",
          timestampMs: eventTimestampMs,
        },
      ],
    });
    const manager: ISubprocessManager = {
      spawn: jest.fn(async (name: TuiDaemonName) => snapshots.get(name)!),
      terminate: jest.fn(async (name: TuiDaemonName) => snapshots.get(name)!),
      terminateAll: jest.fn(async () => {}),
      getStatus: jest.fn((name: TuiDaemonName) => snapshots.get(name)!),
      getAllStatuses: jest.fn(() => Array.from(snapshots.values())),
    };

    const { lastFrame, unmount } = render(
      <SubprocessManagerProvider manager={manager}>
        <CockpitLaunchpadView
          reviewerFrameDurationMs={0}
          refinerFrameDurationMs={0}
          codifierFrameDurationMs={0}
        />
      </SubprocessManagerProvider>,
    );

    await tick();

    expect(renderedTextPosition(lastFrame() ?? "", "12:00:00 agent    retry        retrying review after non-zero agent exit")).toBeGreaterThanOrEqual(0);
    unmount();
  });

  it("keeps the rendered Events panel capped to the latest 10 rows", async () => {
    const snapshots = createSnapshots();
    snapshots.set("reviewer", {
      name: "reviewer",
      status: "running",
      config: defaultConfig,
      pid: 456,
      stdout: [],
      stderr: [],
      events: Array.from({ length: 12 }, (_, index) => ({
        daemon: "reviewer",
        status: "processing" as const,
        timestampMs: eventTimestampMs + index * 1000,
        goalId: `goal_${index}`,
        attempt: 1,
        maxRetries: 3,
      })),
    });
    const manager: ISubprocessManager = {
      spawn: jest.fn(async (name: TuiDaemonName) => snapshots.get(name)!),
      terminate: jest.fn(async (name: TuiDaemonName) => snapshots.get(name)!),
      terminateAll: jest.fn(async () => {}),
      getStatus: jest.fn((name: TuiDaemonName) => snapshots.get(name)!),
      getAllStatuses: jest.fn(() => Array.from(snapshots.values())),
    };

    const { lastFrame, unmount } = render(
      <SubprocessManagerProvider manager={manager}>
        <CockpitLaunchpadView
          reviewerFrameDurationMs={0}
          refinerFrameDurationMs={0}
          codifierFrameDurationMs={0}
        />
      </SubprocessManagerProvider>,
    );

    await tick();

    expect(lastFrame()).toContain("reviewer processing");
    expect(lastFrame()).toContain("goal_11 1/3");
    expect(lastFrame()).not.toContain("goal_0 1/3");
    expect(lastFrame()).not.toContain("goal_1 1/3");
    unmount();
  });

  it("edits only the selected daemon config and passes that config when spawning", async () => {
    const snapshots = createSnapshots();
    const manager: ISubprocessManager = {
      spawn: jest.fn(async (name: TuiDaemonName, config = defaultConfig) => {
        const next = { name, status: "running" as const, config: { ...defaultConfig, ...config }, pid: 123, stdout: [], stderr: [], events: [] };
        snapshots.set(name, next);
        return next;
      }),
      terminate: jest.fn(async (name: TuiDaemonName) => snapshots.get(name)!),
      terminateAll: jest.fn(async () => {}),
      getStatus: jest.fn((name: TuiDaemonName) => snapshots.get(name)!),
      getAllStatuses: jest.fn(() => Array.from(snapshots.values())),
    };

    const { lastFrame, stdin, unmount } = render(
      <SubprocessManagerProvider manager={manager}>
        <CockpitLaunchpadView
          reviewerFrameDurationMs={0}
          refinerFrameDurationMs={0}
          codifierFrameDurationMs={0}
        />
      </SubprocessManagerProvider>,
    );

    stdin.write("a");
    await tick();
    stdin.write("p");
    await tick();
    stdin.write("x");
    await tick();

    expect(lastFrame()).not.toContain("[a] claude [p] 60s [x] 5");
    stdin.write("@");
    await tick();
    expect(renderedTextPosition(lastFrame() ?? "", "[a] codex [p] 30s [x] 3")).toBeGreaterThanOrEqual(0);
    stdin.write("a");
    await tick();
    stdin.write("p");
    await tick();
    stdin.write("x");
    await tick();
    expect(renderedTextPosition(lastFrame() ?? "", "[a] claude [p] 60s [x] 5")).toBeGreaterThanOrEqual(0);
    expect(renderedTextPosition(lastFrame() ?? "", "[s] start")).toBeGreaterThanOrEqual(0);
    stdin.write("\t");
    await tick();
    expect(lastFrame()).toContain("selected reviewer");
    expect(lastFrame()).not.toContain("[a] codex [p] 30s [x] 3");
    stdin.write("@");
    await tick();
    expect(lastFrame()).toContain("[a] codex [p] 30s [x] 3");
    stdin.write("a");
    await tick();
    expect(renderedTextPosition(lastFrame() ?? "", "[a] claude [p] 30s [x] 3")).toBeGreaterThanOrEqual(0);
    stdin.write("\t");
    await tick();
    stdin.write("\t");
    await tick();
    expect(lastFrame()).toContain("selected refiner");
    stdin.write("@");
    await tick();
    expect(renderedTextPosition(lastFrame() ?? "", "[a] claude [p] 60s [x] 5")).toBeGreaterThanOrEqual(0);
    stdin.write("s");
    await tick();
    expect(manager.spawn).toHaveBeenCalledWith("refiner", {
      agentId: "claude",
      pollIntervalMs: 60000,
      maxRetries: 5,
    });
    stdin.write("\t");
    await tick();
    stdin.write("s");
    await tick();
    expect(manager.spawn).toHaveBeenCalledWith("reviewer", {
      agentId: "claude",
      pollIntervalMs: 30000,
      maxRetries: 3,
    });
    expect(manager.spawn).not.toHaveBeenCalledWith("codifier", expect.anything());
    expect(renderedTextPosition(lastFrame() ?? "", "[s] start")).toBeGreaterThanOrEqual(0);
    expect(lastFrame()).toContain("[a] claude [p] 60s [x] 5");
    unmount();
  });

  it("does not mutate pending config when stopping a daemon", async () => {
    const snapshots = createSnapshots();
    const runningConfig = {
      agentId: "claude",
      pollIntervalMs: 60000,
      maxRetries: 5,
    };
    const manager: ISubprocessManager = {
      spawn: jest.fn(async (name: TuiDaemonName, config = defaultConfig) => {
        const next = { name, status: "running" as const, config: { ...config }, pid: 123, stdout: [], stderr: [], events: [] };
        snapshots.set(name, next);
        return next;
      }),
      terminate: jest.fn(async (name: TuiDaemonName) => {
        const next = { name, status: "stopped" as const, config: defaultConfig, stdout: ["stopped"], stderr: [], events: [] };
        snapshots.set(name, next);
        return next;
      }),
      terminateAll: jest.fn(async () => {}),
      getStatus: jest.fn((name: TuiDaemonName) => snapshots.get(name)!),
      getAllStatuses: jest.fn(() => Array.from(snapshots.values())),
    };

    const { lastFrame, stdin, unmount } = render(
      <SubprocessManagerProvider manager={manager}>
        <CockpitLaunchpadView
          reviewerFrameDurationMs={0}
          refinerFrameDurationMs={0}
          codifierFrameDurationMs={0}
        />
      </SubprocessManagerProvider>,
    );

    stdin.write("@");
    await tick();
    stdin.write("a");
    await tick();
    stdin.write("p");
    await tick();
    stdin.write("x");
    await tick();
    stdin.write("s");
    await tick();
    expect(manager.spawn).toHaveBeenCalledWith("refiner", runningConfig);

    stdin.write("s");
    await tick();
    expect(manager.terminate).toHaveBeenCalledWith("refiner");
    expect(renderedTextPosition(lastFrame() ?? "", "[a] claude [p] 60s [x] 5")).toBeGreaterThanOrEqual(0);
    unmount();
  });
});
