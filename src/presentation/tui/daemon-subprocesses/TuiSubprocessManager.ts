import type { ILogger } from "../../../application/logging/ILogger.js";
import { ISubprocessManager, TuiDaemonConfig, TuiDaemonEventSnapshot, TuiDaemonName, TuiSubprocessSnapshot } from "./ISubprocessManager.js";
import type {
  IWorkerDaemonProcessController,
  WorkerDaemonProcess,
} from "../../../application/daemons/IWorkerDaemonProcessController.js";
import {
  DEFAULT_WORKER_DAEMON_CONFIG,
  WORKER_DAEMON_NAMES,
} from "../../../application/daemons/WorkerDaemonCatalog.js";

const OUTPUT_RING_BUFFER_SIZE = 25;
const EVENT_RING_BUFFER_SIZE = 50;
const SUBPROCESS_EVENT_COPY = {
  stopping: {
    category: "stopping",
    message: "termination requested",
  },
  stopped: {
    category: "stopped",
    message: "process stopped",
  },
  failed: {
    category: "failed",
    message: "process failed",
  },
} as const;
const NOOP_LOGGER: ILogger = {
  error: () => {},
  warn: () => {},
  info: () => {},
  debug: () => {},
};

interface ManagedSubprocess {
  readonly name: TuiDaemonName;
  readonly child: WorkerDaemonProcess;
  readonly config: TuiDaemonConfig;
  readonly stdout: string[];
  readonly stderr: string[];
  readonly events: TuiDaemonEventSnapshot[];
  status: "running" | "failed" | "stopped";
  exitCode?: number | null;
  exitSignal?: string | null;
  stopRequested: boolean;
}

export class TuiSubprocessManager implements ISubprocessManager {
  private readonly processes = new Map<TuiDaemonName, ManagedSubprocess>();

  constructor(
    private readonly processController: IWorkerDaemonProcessController,
    private readonly logger: ILogger = NOOP_LOGGER,
  ) {}

  async spawn(name: TuiDaemonName, config: Partial<TuiDaemonConfig> = {}): Promise<TuiSubprocessSnapshot> {
    const existing = this.processes.get(name);
    if (existing?.status === "running") {
      return this.toSnapshot(existing);
    }

    const resolvedConfig = this.resolveConfig(config);
    this.logger.info("Daemon subprocess spawn requested", {
      daemon: name,
      config: resolvedConfig,
    });
    const child = this.processController.spawnDaemonProcess(name, resolvedConfig);

    const managed: ManagedSubprocess = {
      name,
      child,
      config: resolvedConfig,
      stdout: [],
      stderr: [],
      events: [],
      status: "running",
      stopRequested: false,
    };
    this.processes.set(name, managed);
    this.logger.info("Daemon subprocess started", {
      daemon: name,
      pid: child.pid,
    });

    child.stdout?.on("data", (chunk) => {
      const text = chunk.toString();
      const lines = this.appendLines(managed.stdout, text);
      this.logger.info("Daemon subprocess stdout", { daemon: name, text });
      const events = lines.map((line) => parseDaemonOutputEvent(name, line));
      for (const event of events) {
        this.recordDaemonEvent(managed, event);
      }
    });
    child.stderr?.on("data", (chunk) => {
      const text = chunk.toString();
      this.appendLines(managed.stderr, text);
      this.logger.warn("Daemon subprocess stderr", { daemon: name, text });
    });
    child.on("close", (code, signal) => {
      managed.exitCode = code;
      managed.exitSignal = signal;
      managed.status = this.resolveClosedStatus(managed, code);
      this.recordSubprocessTerminalEvent(managed);
      this.logger.info("Daemon subprocess closed", {
        daemon: name,
        exitCode: code,
        signal,
        stopRequested: managed.stopRequested,
        status: managed.status,
      });
    });
    child.on("error", (error) => {
      managed.status = managed.stopRequested ? "stopped" : "failed";
      this.appendLines(managed.stderr, error.message);
      this.recordSubprocessTerminalEvent(managed, error.message);
      this.logger.error("Daemon subprocess error", error, {
        daemon: name,
        stopRequested: managed.stopRequested,
        status: managed.status,
      });
    });

    return this.toSnapshot(managed);
  }

  async terminate(name: TuiDaemonName): Promise<TuiSubprocessSnapshot> {
    const managed = this.processes.get(name);
    if (managed === undefined || managed.status !== "running") {
      return this.getStatus(name);
    }

    try {
      managed.stopRequested = true;
      const strategy = managed.child.pid === undefined
        ? { kind: "no-pid" as const }
        : this.processController.getTerminationStrategy(managed.child);
      this.recordSubprocessLifecycleEvent(managed, {
        status: "stopping",
        ...SUBPROCESS_EVENT_COPY.stopping,
      });
      this.logger.info("Daemon subprocess termination requested", {
        daemon: name,
        pid: managed.child.pid,
        strategy,
      });
      await this.processController.terminateDaemonProcess(managed.child);
      managed.status = "stopped";
      this.recordSubprocessLifecycleEvent(managed, {
        status: "stopped",
        ...SUBPROCESS_EVENT_COPY.stopped,
      });
      this.logger.info("Daemon subprocess termination completed", {
        daemon: name,
        pid: managed.child.pid,
        stopRequested: managed.stopRequested,
      });
    } catch (error) {
      managed.stopRequested = false;
      managed.status = "failed";
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.appendLines(managed.stderr, errorMessage);
      this.recordSubprocessLifecycleEvent(managed, {
        status: "failed",
        errorMessage,
        ...SUBPROCESS_EVENT_COPY.failed,
      });
      this.logger.error("Daemon subprocess termination failed", error, {
        daemon: name,
        pid: managed.child.pid,
        stopRequested: managed.stopRequested,
      });
    }
    return this.toSnapshot(managed);
  }

  async terminateAll(): Promise<void> {
    await Promise.all(Array.from(this.processes.keys()).map((name) => this.terminate(name)));
  }

  getStatus(name: TuiDaemonName): TuiSubprocessSnapshot {
    const managed = this.processes.get(name);
    if (managed === undefined) {
      return {
        name,
        status: "stopped",
        config: DEFAULT_WORKER_DAEMON_CONFIG,
        stdout: [],
        stderr: [],
        events: [],
      };
    }

    return this.toSnapshot(managed);
  }

  getAllStatuses(): readonly TuiSubprocessSnapshot[] {
    return WORKER_DAEMON_NAMES.map((name) => this.getStatus(name));
  }

  private resolveConfig(config: Partial<TuiDaemonConfig>): TuiDaemonConfig {
    return {
      agentId: config.agentId ?? DEFAULT_WORKER_DAEMON_CONFIG.agentId,
      pollIntervalMs: config.pollIntervalMs ?? DEFAULT_WORKER_DAEMON_CONFIG.pollIntervalMs,
      maxRetries: config.maxRetries ?? DEFAULT_WORKER_DAEMON_CONFIG.maxRetries,
    };
  }

  private resolveClosedStatus(
    process: ManagedSubprocess,
    code: number | null,
  ): "failed" | "stopped" {
    if (process.stopRequested) {
      return "stopped";
    }

    return code === 0 ? "stopped" : "failed";
  }

  private appendLines(buffer: string[], value: string): string[] {
    const lines = value.split(/\r?\n/).filter((line) => line.length > 0);
    buffer.push(...lines);
    while (buffer.length > OUTPUT_RING_BUFFER_SIZE) {
      buffer.shift();
    }
    return lines;
  }

  private toSnapshot(process: ManagedSubprocess): TuiSubprocessSnapshot {
    return {
      name: process.name,
      status: process.status,
      config: process.config,
      pid: process.child.pid,
      stdout: [...process.stdout],
      stderr: [...process.stderr],
      events: [...process.events],
      exitCode: process.exitCode,
      exitSignal: process.exitSignal,
      stopRequested: process.stopRequested,
    };
  }

  private recordSubprocessTerminalEvent(
    process: ManagedSubprocess,
    errorMessage = process.stderr[process.stderr.length - 1],
  ): void {
    const status = process.status === "stopped" ? "stopped" : "failed";
    this.recordSubprocessLifecycleEvent(process, {
      status,
      exitCode: process.exitCode ?? undefined,
      errorMessage: status === "failed" ? errorMessage : undefined,
      ...(status === "stopped" ? SUBPROCESS_EVENT_COPY.stopped : SUBPROCESS_EVENT_COPY.failed),
    });
  }

  private recordSubprocessLifecycleEvent(
    process: ManagedSubprocess,
    event: Omit<TuiDaemonEventSnapshot, "daemon" | "source" | "timestampMs">,
  ): void {
    const lastEvent = process.events[process.events.length - 1];
    if (lastEvent?.source === process.name && lastEvent.status === event.status) {
      return;
    }

    this.recordDaemonEvent(process, {
      daemon: process.name,
      source: process.name,
      timestampMs: Date.now(),
      ...event,
    });
  }

  private recordDaemonEvent(
    process: ManagedSubprocess,
    event: TuiDaemonEventSnapshot,
  ): void {
    this.logger.info("Daemon subprocess event", { daemon: process.name, event });
    process.events.push(event);
    while (process.events.length > EVENT_RING_BUFFER_SIZE) {
      process.events.shift();
    }
  }
}

function parseDaemonOutputEvent(
  daemon: TuiDaemonName,
  line: string,
): TuiDaemonEventSnapshot {
  const parsedEvent = parseDaemonEvent(line);

  if (parsedEvent !== null) {
    return parsedEvent;
  }

  return {
    daemon,
    status: "processing",
    source: daemon,
    category: "model-output",
    message: line,
    timestampMs: Date.now(),
  };
}

function parseDaemonEvent(line: string): TuiDaemonEventSnapshot | null {
  try {
    const parsed = JSON.parse(line) as TuiDaemonEventSnapshot;
    if (typeof parsed.daemon !== "string" || typeof parsed.status !== "string") {
      return null;
    }
    return {
      ...parsed,
      timestampMs: parsed.timestampMs ?? Date.now(),
    };
  } catch {
    return null;
  }
}
