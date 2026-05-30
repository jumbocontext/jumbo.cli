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
import {
  TuiDaemonEventStatus,
} from "./TuiDaemonEventStatus.js";
import { TuiDaemonEventCategory } from "./TuiDaemonEventCategory.js";
import {
  TuiSubprocessStatus,
  type TuiSubprocessStatusValue,
} from "./TuiSubprocessStatus.js";
import { TuiSubprocessCopy } from "./TuiSubprocessCopy.js";

const OUTPUT_RING_BUFFER_SIZE = 25;
const EVENT_RING_BUFFER_SIZE = 50;
const OUTPUT_CHUNK_MAX_LENGTH = 16_384;
const OUTPUT_LINE_MAX_LENGTH = 2_048;
const EVENT_TEXT_FIELD_MAX_LENGTH = 2_048;
const SUBPROCESS_EVENT_COPY = {
  stopping: {
    category: TuiDaemonEventCategory.STOPPING,
    message: TuiSubprocessCopy.terminationRequested,
  },
  stopped: {
    category: TuiDaemonEventCategory.STOPPED,
    message: TuiSubprocessCopy.processStopped,
  },
  failed: {
    category: TuiDaemonEventCategory.FAILED,
    message: TuiSubprocessCopy.processFailed,
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
  status: TuiSubprocessStatusValue;
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
    if (existing?.status === TuiSubprocessStatus.RUNNING) {
      return this.toSnapshot(existing);
    }

    const resolvedConfig = this.resolveConfig(config);
    this.logger.info(TuiSubprocessCopy.spawnRequestedLog, {
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
      status: TuiSubprocessStatus.RUNNING,
      stopRequested: false,
    };
    this.processes.set(name, managed);
    this.logger.info(TuiSubprocessCopy.startedLog, {
      daemon: name,
      pid: child.pid,
    });

    child.stdout?.on("data", (chunk) => {
      const text = limitTextTail(chunk.toString(), OUTPUT_CHUNK_MAX_LENGTH);
      const lines = this.appendLines(managed.stdout, text);
      this.logger.info(TuiSubprocessCopy.stdoutLog, { daemon: name, text });
      const events = lines.map((line) => parseDaemonOutputEvent(name, line));
      for (const event of events) {
        this.recordDaemonEvent(managed, event);
      }
    });
    child.stderr?.on("data", (chunk) => {
      const text = limitTextTail(chunk.toString(), OUTPUT_CHUNK_MAX_LENGTH);
      this.appendLines(managed.stderr, text);
      this.logger.warn(TuiSubprocessCopy.stderrLog, { daemon: name, text });
    });
    child.on("close", (code, signal) => {
      managed.exitCode = code;
      managed.exitSignal = signal;
      managed.status = this.resolveClosedStatus(managed, code);
      this.recordSubprocessTerminalEvent(managed);
      this.logger.info(TuiSubprocessCopy.closedLog, {
        daemon: name,
        exitCode: code,
        signal,
        stopRequested: managed.stopRequested,
        status: managed.status,
      });
    });
    child.on("error", (error) => {
      managed.status = managed.stopRequested
        ? TuiSubprocessStatus.STOPPED
        : TuiSubprocessStatus.FAILED;
      const errorMessage = limitTextTail(error.message, EVENT_TEXT_FIELD_MAX_LENGTH);
      this.appendLines(managed.stderr, errorMessage);
      this.recordSubprocessTerminalEvent(managed, errorMessage);
      this.logger.error(TuiSubprocessCopy.errorLog, boundedError(error), {
        daemon: name,
        stopRequested: managed.stopRequested,
        status: managed.status,
      });
    });

    return this.toSnapshot(managed);
  }

  async terminate(name: TuiDaemonName): Promise<TuiSubprocessSnapshot> {
    const managed = this.processes.get(name);
    if (managed === undefined || managed.status !== TuiSubprocessStatus.RUNNING) {
      return this.getStatus(name);
    }

    try {
      managed.stopRequested = true;
      const strategy = managed.child.pid === undefined
        ? { kind: "no-pid" as const }
        : this.processController.getTerminationStrategy(managed.child);
      this.recordSubprocessLifecycleEvent(managed, {
        status: TuiDaemonEventStatus.STOPPING,
        ...SUBPROCESS_EVENT_COPY.stopping,
      });
      this.logger.info(TuiSubprocessCopy.terminationRequestedLog, {
        daemon: name,
        pid: managed.child.pid,
        strategy,
      });
      await this.processController.terminateDaemonProcess(managed.child);
      managed.status = TuiSubprocessStatus.STOPPED;
      this.recordSubprocessLifecycleEvent(managed, {
        status: TuiDaemonEventStatus.STOPPED,
        ...SUBPROCESS_EVENT_COPY.stopped,
      });
      this.logger.info(TuiSubprocessCopy.terminationCompletedLog, {
        daemon: name,
        pid: managed.child.pid,
        stopRequested: managed.stopRequested,
      });
    } catch (error) {
      managed.stopRequested = false;
      managed.status = TuiSubprocessStatus.FAILED;
      const errorMessage = limitTextTail(error instanceof Error ? error.message : String(error), EVENT_TEXT_FIELD_MAX_LENGTH);
      this.appendLines(managed.stderr, errorMessage);
      this.recordSubprocessLifecycleEvent(managed, {
        status: TuiDaemonEventStatus.FAILED,
        errorMessage,
        ...SUBPROCESS_EVENT_COPY.failed,
      });
      this.logger.error(TuiSubprocessCopy.terminationFailedLog, boundedError(error), {
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
        status: TuiSubprocessStatus.STOPPED,
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
  ): TuiSubprocessStatusValue {
    if (process.stopRequested) {
      return TuiSubprocessStatus.STOPPED;
    }

    return code === 0 ? TuiSubprocessStatus.STOPPED : TuiSubprocessStatus.FAILED;
  }

  private appendLines(buffer: string[], value: string): string[] {
    const lines = value
      .split(/\r?\n/)
      .filter((line) => line.length > 0);
    buffer.push(...lines.map((line) => limitTextTail(line, OUTPUT_LINE_MAX_LENGTH)));
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
    const status = process.status === TuiSubprocessStatus.STOPPED
      ? TuiDaemonEventStatus.STOPPED
      : TuiDaemonEventStatus.FAILED;
    this.recordSubprocessLifecycleEvent(process, {
      status,
      exitCode: process.exitCode ?? undefined,
      errorMessage: status === TuiDaemonEventStatus.FAILED ? errorMessage : undefined,
      ...(status === TuiDaemonEventStatus.STOPPED ? SUBPROCESS_EVENT_COPY.stopped : SUBPROCESS_EVENT_COPY.failed),
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
    const boundedEvent = boundDaemonEvent(event);
    this.logger.info(TuiSubprocessCopy.eventLog, { daemon: process.name, event: boundedEvent });
    process.events.push(boundedEvent);
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
    status: TuiDaemonEventStatus.PROCESSING,
    source: daemon,
    category: TuiDaemonEventCategory.MODEL_OUTPUT,
    message: limitTextTail(line, EVENT_TEXT_FIELD_MAX_LENGTH),
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

function boundDaemonEvent(event: TuiDaemonEventSnapshot): TuiDaemonEventSnapshot {
  return {
    ...event,
    daemon: limitTextTail(event.daemon, EVENT_TEXT_FIELD_MAX_LENGTH),
    status: limitTextTail(event.status, EVENT_TEXT_FIELD_MAX_LENGTH),
    source: boundOptionalText(event.source),
    category: boundOptionalText(event.category),
    message: boundOptionalText(event.message),
    goalId: boundOptionalText(event.goalId),
    errorMessage: boundOptionalText(event.errorMessage),
  };
}

function boundOptionalText(value: string | undefined): string | undefined {
  return value === undefined ? undefined : limitTextTail(value, EVENT_TEXT_FIELD_MAX_LENGTH);
}

function boundedError(error: unknown): unknown {
  if (!(error instanceof Error)) {
    return error;
  }

  const bounded = new Error(limitTextTail(error.message, EVENT_TEXT_FIELD_MAX_LENGTH));
  bounded.name = error.name;
  bounded.stack = boundOptionalText(error.stack);
  return bounded;
}

function limitTextTail(value: string, maxLength: number): string {
  return value.length > maxLength ? value.slice(-maxLength) : value;
}
