import React from "react";
import { jest, describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { CockpitLaunchpadView } from "../../../../src/presentation/tui/cockpit/CockpitLaunchpadView.js";
import { SubprocessManagerProvider } from "../../../../src/presentation/tui/daemon-subprocesses/SubprocessManagerProvider.js";
import type { ISubprocessManager, TuiDaemonConfig, TuiDaemonName, TuiSubprocessSnapshot } from "../../../../src/presentation/tui/daemon-subprocesses/ISubprocessManager.js";

const tick = () => new Promise((resolve) => setTimeout(resolve, 50));
const defaultConfig = {
  agentId: "codex",
  pollIntervalMs: 30000,
  maxRetries: 3,
};

function createSnapshots(config: TuiDaemonConfig = defaultConfig): Map<TuiDaemonName, TuiSubprocessSnapshot> {
  return new Map<TuiDaemonName, TuiSubprocessSnapshot>([
    ["reviewer", { name: "reviewer", status: "stopped", config, stdout: [], stderr: [], events: [] }],
    ["refiner", { name: "refiner", status: "stopped", config, stdout: [], stderr: [], events: [] }],
    ["codifier", { name: "codifier", status: "stopped", config, stdout: [], stderr: [], events: [] }],
  ]);
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
          stdout: [],
          stderr: [],
          events: [],
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

    const { stdin, unmount } = render(
      <SubprocessManagerProvider manager={manager}>
        <CockpitLaunchpadView
          reviewerFrameDurationMs={0}
          refinerFrameDurationMs={0}
          codifierFrameDurationMs={0}
        />
      </SubprocessManagerProvider>,
    );



    stdin.write("s");
    await tick();
    expect(manager.spawn).toHaveBeenCalledWith("refiner", defaultConfig);

    stdin.write("s");
    await tick();
    expect(manager.terminate).toHaveBeenCalledWith("refiner");

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

  it("cycles focused daemon panels with tab and toggles the focused daemon with s", async () => {
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

    const { stdin, unmount } = render(
      <SubprocessManagerProvider manager={manager}>
        <CockpitLaunchpadView
          reviewerFrameDurationMs={0}
          refinerFrameDurationMs={0}
          codifierFrameDurationMs={0}
        />
      </SubprocessManagerProvider>,
    );

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

});
