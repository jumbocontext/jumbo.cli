import { EventEmitter } from "node:events";
import { Readable } from "node:stream";
import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import type { ILogger } from "../../../../src/application/logging/ILogger.js";
import type {
  IWorkerDaemonProcessController,
  WorkerDaemonProcess,
} from "../../../../src/application/daemons/IWorkerDaemonProcessController.js";
import { TuiSubprocessManager } from "../../../../src/presentation/tui/daemon-subprocesses/TuiSubprocessManager.js";

function logger(): jest.Mocked<ILogger> {
  return {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
}

function childProcess(pid = 123): WorkerDaemonProcess & EventEmitter {
  const child = new EventEmitter() as WorkerDaemonProcess & EventEmitter & {
    pid: number;
    stdout: Readable;
    stderr: Readable;
  };
  child.pid = pid;
  child.stdout = new Readable({ read() {} });
  child.stderr = new Readable({ read() {} });
  return child;
}

function processController(child: WorkerDaemonProcess): jest.Mocked<IWorkerDaemonProcessController> {
  return {
    spawnDaemonProcess: jest.fn(() => child),
    terminateDaemonProcess: jest.fn<() => Promise<void>>().mockResolvedValue(),
    getTerminationStrategy: jest.fn(() => ({
      kind: "unix-process-group",
      signal: "SIGTERM",
      pid: -(child.pid ?? 0),
    })),
  };
}

describe("TuiSubprocessManager", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("spawns daemon targets through the injected process controller and ring-buffers output", async () => {
    const child = childProcess();
    const controller = processController(child);
    const testLogger = logger();
    const manager = new TuiSubprocessManager(controller, testLogger);

    const snapshot = await manager.spawn("refiner");
    child.stdout?.emit("data", Buffer.from("line 1\nline 2\n"));

    expect(snapshot.status).toBe("running");
    expect(controller.spawnDaemonProcess).toHaveBeenCalledWith("refiner", {
      agentId: "codex",
      pollIntervalMs: 30000,
      maxRetries: 3,
    });
    expect(manager.getStatus("refiner").stdout).toEqual(["line 1", "line 2"]);
    expect(testLogger.info).toHaveBeenCalledWith("Daemon subprocess spawn requested", {
      daemon: "refiner",
      config: {
        agentId: "codex",
        pollIntervalMs: 30000,
        maxRetries: 3,
      },
    });
    expect(testLogger.info).toHaveBeenCalledWith("Daemon subprocess stdout", {
      daemon: "refiner",
      text: "line 1\nline 2\n",
    });
  });

  it("emits non-json stdout lines as model-output events", async () => {
    const child = childProcess();
    const manager = new TuiSubprocessManager(processController(child));
    jest.spyOn(Date, "now").mockReturnValue(1767272400000);

    await manager.spawn("codifier");
    child.stdout?.emit("data", Buffer.from("Model proposed a codification summary.\n"));

    expect(manager.getStatus("codifier").events).toEqual([
      {
        daemon: "codifier",
        status: "processing",
        source: "codifier",
        category: "model-output",
        message: "Model proposed a codification summary.",
        timestampMs: 1767272400000,
      },
    ]);
  });

  it("caps oversized daemon chunks, stored lines, and model-output event messages", async () => {
    const child = childProcess();
    const testLogger = logger();
    const manager = new TuiSubprocessManager(processController(child), testLogger);
    const oversizedLine = `${"x".repeat(20_000)}tail`;

    await manager.spawn("codifier");
    child.stdout?.emit("data", Buffer.from(`${oversizedLine}\n`));
    child.stderr?.emit("data", Buffer.from(`${oversizedLine}\n`));

    const snapshot = manager.getStatus("codifier");
    expect(snapshot.stdout).toHaveLength(1);
    expect(snapshot.stderr).toHaveLength(1);
    expect(snapshot.stdout[0]).toHaveLength(2_048);
    expect(snapshot.stderr[0]).toHaveLength(2_048);
    expect(snapshot.stdout[0]).toContain("tail");
    expect(snapshot.events[0].message).toHaveLength(2_048);
    expect(snapshot.events[0].message).toContain("tail");
    expect(testLogger.info).toHaveBeenCalledWith("Daemon subprocess stdout", {
      daemon: "codifier",
      text: expect.stringMatching(/tail\n$/),
    });
    expect(testLogger.warn).toHaveBeenCalledWith("Daemon subprocess stderr", {
      daemon: "codifier",
      text: expect.stringMatching(/tail\n$/),
    });
    const stdoutLog = testLogger.info.mock.calls.find(([message]) => message === "Daemon subprocess stdout")?.[1];
    const stderrLog = testLogger.warn.mock.calls.find(([message]) => message === "Daemon subprocess stderr")?.[1];
    expect(String(stdoutLog?.text)).toHaveLength(16_384);
    expect(String(stderrLog?.text)).toHaveLength(16_384);
  });

  it("passes configured agent, poll interval, and retry flags, parses daemon events, and logs them", async () => {
    const child = childProcess();
    const testLogger = logger();
    const controller = processController(child);
    const manager = new TuiSubprocessManager(controller, testLogger);
    jest.spyOn(Date, "now").mockReturnValue(1767272400000);

    await manager.spawn("refiner", {
      agentId: "claude",
      pollIntervalMs: 10_000,
      maxRetries: 5,
    });
    child.stdout?.emit("data", Buffer.from("{\"daemon\":\"refiner\",\"status\":\"processing\",\"goalId\":\"goal_123\",\"attempt\":2,\"maxRetries\":5}\n"));

    expect(controller.spawnDaemonProcess).toHaveBeenCalledWith("refiner", {
      agentId: "claude",
      pollIntervalMs: 10_000,
      maxRetries: 5,
    });
    expect(manager.getStatus("refiner").events).toEqual([
      {
        daemon: "refiner",
        status: "processing",
        timestampMs: 1767272400000,
        goalId: "goal_123",
        attempt: 2,
        maxRetries: 5,
      },
    ]);
    expect(testLogger.info).toHaveBeenCalledWith("Daemon subprocess event", {
      daemon: "refiner",
      event: {
        daemon: "refiner",
        status: "processing",
        timestampMs: 1767272400000,
        goalId: "goal_123",
        attempt: 2,
        maxRetries: 5,
      },
    });
  });

  it("parses structured daemon events before capping retained stdout lines", async () => {
    const child = childProcess();
    const manager = new TuiSubprocessManager(processController(child));
    const errorMessage = "x".repeat(2_048);

    await manager.spawn("reviewer");
    child.stdout?.emit("data", Buffer.from(`${JSON.stringify({
      daemon: "reviewer",
      status: "failed",
      source: "reviewer",
      category: "failed",
      errorMessage,
    })}\n`));

    const snapshot = manager.getStatus("reviewer");
    expect(snapshot.stdout).toHaveLength(1);
    expect(snapshot.stdout[0]).toHaveLength(2_048);
    expect(snapshot.events).toEqual([
      expect.objectContaining({
        daemon: "reviewer",
        status: "failed",
        source: "reviewer",
        category: "failed",
        errorMessage,
      }),
    ]);
    expect(snapshot.events[0].category).not.toBe("model-output");
  });

  it("keeps only the latest 50 parsed daemon events in memory", async () => {
    const child = childProcess();
    const manager = new TuiSubprocessManager(processController(child));

    await manager.spawn("refiner");

    const eventLines = Array.from({ length: 55 }, (_, index) =>
      JSON.stringify({
        daemon: "refiner",
        status: "processing",
        goalId: `goal_${index}`,
        attempt: 1,
        maxRetries: 3,
      })
    ).join("\n");
    child.stdout?.emit("data", Buffer.from(`${eventLines}\n`));

    const events = manager.getStatus("refiner").events;
    expect(events).toHaveLength(50);
    expect(events[0]).toEqual(expect.objectContaining({ goalId: "goal_5" }));
    expect(events[49]).toEqual(expect.objectContaining({ goalId: "goal_54" }));
  });

  it("logs daemon stderr and child process failures through ILogger", async () => {
    const child = childProcess();
    const testLogger = logger();
    const manager = new TuiSubprocessManager(processController(child), testLogger);
    jest.spyOn(Date, "now").mockReturnValue(1767272400000);

    await manager.spawn("refiner");
    child.stderr?.emit("data", Buffer.from("refiner failed\n"));
    child.emit("error", new Error("spawn failed"));

    expect(testLogger.warn).toHaveBeenCalledWith("Daemon subprocess stderr", {
      daemon: "refiner",
      text: "refiner failed\n",
    });
    expect(testLogger.error).toHaveBeenCalledWith(
      "Daemon subprocess error",
      expect.any(Error),
      { daemon: "refiner", stopRequested: false, status: "failed" },
    );
    expect(manager.getStatus("refiner").events).toEqual([
      {
        daemon: "refiner",
        status: "failed",
        source: "refiner",
        category: "failed",
        message: "process failed",
        timestampMs: 1767272400000,
        errorMessage: "spawn failed",
      },
    ]);
  });

  it("delegates process termination and records stopping and stopped lifecycle events", async () => {
    const child = childProcess(456);
    const controller = processController(child);
    const manager = new TuiSubprocessManager(controller);
    jest.spyOn(Date, "now").mockReturnValue(1767272400000);

    await manager.spawn("reviewer");
    const terminated = await manager.terminate("reviewer");

    expect(controller.getTerminationStrategy).toHaveBeenCalledWith(child);
    expect(controller.terminateDaemonProcess).toHaveBeenCalledWith(child);
    expect(terminated.events).toEqual([
      {
        daemon: "reviewer",
        status: "stopping",
        source: "reviewer",
        category: "stopping",
        message: "termination requested",
        timestampMs: 1767272400000,
      },
      {
        daemon: "reviewer",
        status: "stopped",
        source: "reviewer",
        category: "stopped",
        message: "process stopped",
        timestampMs: 1767272400000,
      },
    ]);
  });

  it("captures termination failures without throwing into the TUI input handler", async () => {
    const child = childProcess(789);
    const controller = processController(child);
    controller.terminateDaemonProcess.mockRejectedValue(new Error("taskkill failed"));
    const testLogger = logger();
    const manager = new TuiSubprocessManager(controller, testLogger);

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
      { daemon: "refiner", pid: 789, stopRequested: false },
    );
  });

  it("keeps a requested stop stopped when child error and close events arrive after termination", async () => {
    const child = childProcess(321);
    const testLogger = logger();
    const manager = new TuiSubprocessManager(processController(child), testLogger);

    await manager.spawn("codifier");
    await manager.terminate("codifier");
    child.emit("error", new Error("process already terminated"));
    child.emit("close", null, "SIGTERM");

    expect(manager.getStatus("codifier")).toEqual(expect.objectContaining({
      status: "stopped",
      exitCode: null,
      exitSignal: "SIGTERM",
      stopRequested: true,
      stderr: expect.arrayContaining(["process already terminated"]),
    }));
    expect(testLogger.error).toHaveBeenCalledWith(
      "Daemon subprocess error",
      expect.any(Error),
      { daemon: "codifier", stopRequested: true, status: "stopped" },
    );
  });

  it("reports unexpected signal exits as failed when no stop was requested", async () => {
    const child = childProcess(654);
    const testLogger = logger();
    const manager = new TuiSubprocessManager(processController(child), testLogger);

    await manager.spawn("refiner");
    child.emit("close", null, "SIGTERM");

    expect(manager.getStatus("refiner")).toEqual(expect.objectContaining({
      status: "failed",
      exitCode: null,
      exitSignal: "SIGTERM",
      stopRequested: false,
    }));
    expect(testLogger.info).toHaveBeenCalledWith("Daemon subprocess closed", {
      daemon: "refiner",
      exitCode: null,
      signal: "SIGTERM",
      stopRequested: false,
      status: "failed",
    });
  });
});
