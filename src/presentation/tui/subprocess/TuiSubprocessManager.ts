import { spawn, ChildProcess, execFile } from "node:child_process";
import path from "path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import type { ILogger } from "../../../application/logging/ILogger.js";
import { ISubprocessManager, TuiDaemonConfig, TuiDaemonEventSnapshot, TuiDaemonName, TuiSubprocessSnapshot } from "./ISubprocessManager.js";

const execFileAsync = promisify(execFile);
const OUTPUT_RING_BUFFER_SIZE = 25;
const EVENT_RING_BUFFER_SIZE = 50;
const DEFAULT_DAEMON_CONFIG: TuiDaemonConfig = {
  agentId: "codex",
  pollIntervalMs: 30_000,
  maxRetries: 3,
};
const NOOP_LOGGER: ILogger = {
  error: () => {},
  warn: () => {},
  info: () => {},
  debug: () => {},
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ManagedSubprocess {
  readonly name: TuiDaemonName;
  readonly child: ChildProcess;
  readonly config: TuiDaemonConfig;
  readonly stdout: string[];
  readonly stderr: string[];
  readonly events: TuiDaemonEventSnapshot[];
  status: "running" | "failed" | "stopped";
  exitCode?: number | null;
  exitSignal?: NodeJS.Signals | null;
  stopRequested: boolean;
}

export class TuiSubprocessManager implements ISubprocessManager {
  private readonly processes = new Map<TuiDaemonName, ManagedSubprocess>();

  constructor(private readonly logger: ILogger = NOOP_LOGGER) {}

  async spawn(name: TuiDaemonName, config: Partial<TuiDaemonConfig> = {}): Promise<TuiSubprocessSnapshot> {
    const existing = this.processes.get(name);
    if (existing?.status === "running") {
      return this.toSnapshot(existing);
    }

    const resolvedConfig = this.resolveConfig(config);
    const daemonTarget = this.resolveDaemonTarget(name);
    this.logger.info("Daemon subprocess spawn requested", {
      daemon: name,
      config: resolvedConfig,
      target: daemonTarget,
    });
    const child = spawn(process.execPath, [
      daemonTarget,
      "--agent",
      resolvedConfig.agentId,
      "--poll-interval-ms",
      String(resolvedConfig.pollIntervalMs),
      "--max-retries",
      String(resolvedConfig.maxRetries),
    ], {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
      detached: process.platform !== "win32",
    });

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

    child.stdout?.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      const lines = this.appendLines(managed.stdout, text);
      this.logger.info("Daemon subprocess stdout", { daemon: name, text });
      const events = lines.map((line) => parseDaemonOutputEvent(name, line));
      for (const event of events) {
        this.logger.info("Daemon subprocess event", { daemon: name, event });
      }
      managed.events.push(...events);
      while (managed.events.length > EVENT_RING_BUFFER_SIZE) {
        managed.events.shift();
      }
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      this.appendLines(managed.stderr, text);
      this.logger.warn("Daemon subprocess stderr", { daemon: name, text });
    });
    child.on("close", (code, signal) => {
      managed.exitCode = code;
      managed.exitSignal = signal;
      managed.status = this.resolveClosedStatus(managed, code);
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
        : getTerminationStrategy(process.platform, managed.child.pid);
      this.logger.info("Daemon subprocess termination requested", {
        daemon: name,
        pid: managed.child.pid,
        strategy,
      });
      await this.terminateProcess(managed.child);
      managed.status = "stopped";
      this.logger.info("Daemon subprocess termination completed", {
        daemon: name,
        pid: managed.child.pid,
        stopRequested: managed.stopRequested,
      });
    } catch (error) {
      managed.stopRequested = false;
      managed.status = "failed";
      this.appendLines(
        managed.stderr,
        error instanceof Error ? error.message : String(error),
      );
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
        config: DEFAULT_DAEMON_CONFIG,
        stdout: [],
        stderr: [],
        events: [],
      };
    }

    return this.toSnapshot(managed);
  }

  getAllStatuses(): readonly TuiSubprocessSnapshot[] {
    return (["reviewer", "refiner", "codifier"] as const).map((name) => this.getStatus(name));
  }

  private resolveDaemonTarget(name: TuiDaemonName): string {
    return path.resolve(__dirname, "..", "..", "work", `${name}.daemon.js`);
  }

  private async terminateProcess(child: ChildProcess): Promise<void> {
    if (child.pid === undefined) {
      return;
    }

    if (getTerminationStrategy(process.platform, child.pid).kind === "windows-tree") {
      await execFileAsync("taskkill", ["/F", "/T", "/PID", String(child.pid)]);
      return;
    }

    process.kill(-child.pid, "SIGTERM");
  }

  private resolveConfig(config: Partial<TuiDaemonConfig>): TuiDaemonConfig {
    return {
      agentId: config.agentId ?? DEFAULT_DAEMON_CONFIG.agentId,
      pollIntervalMs: config.pollIntervalMs ?? DEFAULT_DAEMON_CONFIG.pollIntervalMs,
      maxRetries: config.maxRetries ?? DEFAULT_DAEMON_CONFIG.maxRetries,
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

export function getTerminationStrategy(
  platform: NodeJS.Platform,
  pid: number,
): { kind: "windows-tree"; command: "taskkill"; args: string[] } | { kind: "unix-process-group"; signal: "SIGTERM"; pid: number } {
  if (platform === "win32") {
    return { kind: "windows-tree", command: "taskkill", args: ["/F", "/T", "/PID", String(pid)] };
  }

  return { kind: "unix-process-group", signal: "SIGTERM", pid: -pid };
}
