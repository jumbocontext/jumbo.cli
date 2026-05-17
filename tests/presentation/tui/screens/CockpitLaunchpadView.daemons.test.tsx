import React from "react";
import { jest, describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { CockpitLaunchpadView } from "../../../../src/presentation/tui/screens/CockpitLaunchpadView.js";
import { SubprocessManagerProvider } from "../../../../src/presentation/tui/subprocess/SubprocessManagerContext.js";
import type { ISubprocessManager, TuiDaemonName, TuiSubprocessSnapshot } from "../../../../src/presentation/tui/subprocess/ISubprocessManager.js";

const tick = () => new Promise((resolve) => setTimeout(resolve, 50));
const defaultConfig = {
  agentId: "codex",
  pollIntervalMs: 30000,
  maxRetries: 3,
};

describe("CockpitLaunchpadView daemon controls", () => {
  it("starts and stops real daemon targets through ISubprocessManager without replacing launchpad panels", async () => {
    const snapshots = new Map<TuiDaemonName, TuiSubprocessSnapshot>([
      ["reviewer", { name: "reviewer", status: "stopped", config: defaultConfig, stdout: [], stderr: [], events: [] }],
      ["refiner", { name: "refiner", status: "stopped", config: defaultConfig, stdout: [], stderr: [], events: [] }],
      ["codifier", { name: "codifier", status: "stopped", config: defaultConfig, stdout: [], stderr: [], events: [] }],
    ]);
    const manager: ISubprocessManager = {
      spawn: jest.fn(async (name: TuiDaemonName, config = defaultConfig) => {
        const next = {
          name,
          status: "running" as const,
          config: { ...defaultConfig, ...config },
          pid: 123,
          stdout: ["{\"daemon\":\"refiner\",\"status\":\"processing\",\"goalId\":\"goal_123456\",\"attempt\":1,\"maxRetries\":3}"],
          stderr: [],
          events: [{ daemon: "refiner", status: "processing", goalId: "goal_123456", attempt: 1, maxRetries: 3 }],
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

    const { lastFrame, stdin } = render(
      <SubprocessManagerProvider manager={manager}>
        <CockpitLaunchpadView
          reviewerFrameDurationMs={0}
          refinerFrameDurationMs={0}
          codifierFrameDurationMs={0}
        />
      </SubprocessManagerProvider>,
    );

    expect(lastFrame()).toContain("PROJECT//");
    expect(lastFrame()).toContain("SESSION//");
    expect(lastFrame()).toContain("REFINER//");
    expect(lastFrame()).toContain("CODIFIER//");
    expect(lastFrame()).toContain("[a] codex [p] 30s [x] 3");

    stdin.write("r");
    await tick();
    expect(manager.spawn).toHaveBeenCalledWith("refiner", defaultConfig);
    expect(lastFrame()).toContain("REFINER// (running)");
    expect(lastFrame()).toContain("refining goal_123");

    stdin.write("r");
    await tick();
    expect(manager.terminate).toHaveBeenCalledWith("refiner");
  });

  it("ports legacy daemon flags into visible TUI controls before spawning", async () => {
    const snapshots = new Map<TuiDaemonName, TuiSubprocessSnapshot>([
      ["reviewer", { name: "reviewer", status: "stopped", config: defaultConfig, stdout: [], stderr: [], events: [] }],
      ["refiner", { name: "refiner", status: "stopped", config: defaultConfig, stdout: [], stderr: [], events: [] }],
      ["codifier", { name: "codifier", status: "stopped", config: defaultConfig, stdout: [], stderr: [], events: [] }],
    ]);
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

    const { lastFrame, stdin } = render(
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

    expect(lastFrame()).toContain("[a] claude [p] 60s [x] 5");
    stdin.write("r");
    await tick();
    expect(manager.spawn).toHaveBeenCalledWith("refiner", {
      agentId: "claude",
      pollIntervalMs: 60000,
      maxRetries: 5,
    });
  });
});
