import { EventEmitter } from "node:events";
import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";

const spawnMock = jest.fn();
const execFileMock = jest.fn();

jest.unstable_mockModule("node:child_process", () => ({
  spawn: spawnMock,
  execFile: execFileMock,
}));

const {
  NodeWorkerDaemonProcessController,
  getNodeWorkerDaemonTerminationStrategy,
} = await import("../../../src/infrastructure/daemons/NodeWorkerDaemonProcessController.js");

describe("NodeWorkerDaemonProcessController", () => {
  beforeEach(() => {
    spawnMock.mockReset();
    execFileMock.mockReset();
    execFileMock.mockImplementation((_file, _args, callback) => callback(null, "", ""));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("spawns daemon targets with the configured agent, poll interval, and retries", () => {
    const child = new EventEmitter();
    spawnMock.mockReturnValue(child);
    const controller = new NodeWorkerDaemonProcessController();

    expect(controller.spawnDaemonProcess("refiner", {
      agentId: "claude",
      pollIntervalMs: 10_000,
      maxRetries: 5,
    })).toBe(child);

    expect(spawnMock).toHaveBeenCalledWith(
      process.execPath,
      [
        expect.stringMatching(/presentation[\\/]work[\\/]refiner\.daemon\.js$/),
        "--agent",
        "claude",
        "--poll-interval-ms",
        "10000",
        "--max-retries",
        "5",
      ],
      expect.objectContaining({
        cwd: process.cwd(),
        detached: process.platform !== "win32",
      }),
    );
  });

  it("defines Unix process-group signaling for non-Windows hosts", () => {
    expect(getNodeWorkerDaemonTerminationStrategy("linux", 456)).toEqual({
      kind: "unix-process-group",
      signal: "SIGTERM",
      pid: -456,
    });
  });

  it("defines forced Windows task tree termination", () => {
    expect(getNodeWorkerDaemonTerminationStrategy("win32", 456)).toEqual({
      kind: "windows-tree",
      command: "taskkill",
      args: ["/F", "/T", "/PID", "456"],
    });
  });
});
