import { EventEmitter } from "node:events";
import { Readable } from "node:stream";
import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import type { ILogger } from "../../../../src/application/logging/ILogger.js";

const spawnMock = jest.fn();
const execFileMock = jest.fn();

jest.unstable_mockModule("node:child_process", () => ({
  spawn: spawnMock,
  execFile: execFileMock,
}));

const { TuiSubprocessManager, getTerminationStrategy } = await import("../../../../src/presentation/tui/subprocess/TuiSubprocessManager.js");

function logger(): jest.Mocked<ILogger> {
  return {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
}

function childProcess(pid = 123): EventEmitter & { pid: number; stdout: Readable; stderr: Readable } {
  const child = new EventEmitter() as EventEmitter & { pid: number; stdout: Readable; stderr: Readable };
  child.pid = pid;
  child.stdout = new Readable({ read() {} });
  child.stderr = new Readable({ read() {} });
  return child;
}

describe("TuiSubprocessManager", () => {
  beforeEach(() => {
    spawnMock.mockReset();
    execFileMock.mockReset();
    execFileMock.mockImplementation((_file, _args, callback) => callback(null, "", ""));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("spawns daemon targets and ring-buffers output", async () => {
    const child = childProcess();
    spawnMock.mockReturnValue(child);
    const testLogger = logger();
    const manager = new TuiSubprocessManager(testLogger);

    const snapshot = await manager.spawn("refiner");
    child.stdout.emit("data", Buffer.from("line 1\nline 2\n"));

    expect(snapshot.status).toBe("running");
    expect(spawnMock).toHaveBeenCalledWith(
      process.execPath,
      [
        expect.stringContaining("refiner.daemon.js"),
        "--agent",
        "codex",
        "--poll-interval-ms",
        "30000",
        "--max-retries",
        "3",
      ],
      expect.objectContaining({ cwd: process.cwd(), detached: process.platform !== "win32" }),
    );
    expect(manager.getStatus("refiner").stdout).toEqual(["line 1", "line 2"]);
    expect(testLogger.info).toHaveBeenCalledWith("Daemon subprocess spawn requested", expect.objectContaining({
      daemon: "refiner",
      config: {
        agentId: "codex",
        pollIntervalMs: 30000,
        maxRetries: 3,
      },
    }));
    expect(testLogger.info).toHaveBeenCalledWith("Daemon subprocess stdout", {
      daemon: "refiner",
      text: "line 1\nline 2\n",
    });
  });

  it("passes configured agent, poll interval, and retry flags and parses daemon events", async () => {
    const child = childProcess();
    spawnMock.mockReturnValue(child);
    const manager = new TuiSubprocessManager();

    await manager.spawn("refiner", {
      agentId: "claude",
      pollIntervalMs: 10_000,
      maxRetries: 5,
    });
    child.stdout.emit("data", Buffer.from("{\"daemon\":\"refiner\",\"status\":\"processing\",\"goalId\":\"goal_123\",\"attempt\":2,\"maxRetries\":5}\n"));

    expect(spawnMock).toHaveBeenCalledWith(
      process.execPath,
      [
        expect.stringContaining("refiner.daemon.js"),
        "--agent",
        "claude",
        "--poll-interval-ms",
        "10000",
        "--max-retries",
        "5",
      ],
      expect.any(Object),
    );
    expect(manager.getStatus("refiner").config).toEqual({
      agentId: "claude",
      pollIntervalMs: 10_000,
      maxRetries: 5,
    });
    expect(manager.getStatus("refiner").events).toEqual([
      {
        daemon: "refiner",
        status: "processing",
        goalId: "goal_123",
        attempt: 2,
        maxRetries: 5,
      },
    ]);
  });

  it("logs daemon stderr and child process failures through ILogger", async () => {
    const child = childProcess();
    spawnMock.mockReturnValue(child);
    const testLogger = logger();
    const manager = new TuiSubprocessManager(testLogger);

    await manager.spawn("refiner");
    child.stderr.emit("data", Buffer.from("refiner failed\n"));
    child.emit("error", new Error("spawn failed"));

    expect(testLogger.warn).toHaveBeenCalledWith("Daemon subprocess stderr", {
      daemon: "refiner",
      text: "refiner failed\n",
    });
    expect(testLogger.error).toHaveBeenCalledWith(
      "Daemon subprocess error",
      expect.any(Error),
      { daemon: "refiner" },
    );
  });

  it("uses Windows taskkill tree termination on the current Windows host", async () => {
    if (process.platform !== "win32") {
      return;
    }
    const child = childProcess(456);
    spawnMock.mockReturnValue(child);
    const manager = new TuiSubprocessManager();

    await manager.spawn("reviewer");
    await manager.terminate("reviewer");

    expect(execFileMock).toHaveBeenCalledWith("taskkill", ["/F", "/T", "/PID", "456"], expect.any(Function));
  });

  it("captures termination failures without throwing into the TUI input handler", async () => {
    const child = childProcess(789);
    spawnMock.mockReturnValue(child);
    execFileMock.mockImplementation((_file, _args, callback) => {
      callback(new Error("taskkill failed"), "", "failure");
    });
    const testLogger = logger();
    const manager = new TuiSubprocessManager(testLogger);

    await manager.spawn("refiner");
    await expect(manager.terminate("refiner")).resolves.toEqual(
      expect.objectContaining({
        status: "failed",
        stderr: expect.arrayContaining(["taskkill failed"]),
      }),
    );
    expect(testLogger.error).toHaveBeenCalledWith(
      "Daemon subprocess termination failed",
      expect.any(Error),
      { daemon: "refiner", pid: 789 },
    );
  });

  it("defines Unix process-group signaling for non-Windows hosts", () => {
    expect(getTerminationStrategy("linux", 456)).toEqual({
      kind: "unix-process-group",
      signal: "SIGTERM",
      pid: -456,
    });
  });

  it("defines forced Windows task tree termination", () => {
    expect(getTerminationStrategy("win32", 456)).toEqual({
      kind: "windows-tree",
      command: "taskkill",
      args: ["/F", "/T", "/PID", "456"],
    });
  });
});
