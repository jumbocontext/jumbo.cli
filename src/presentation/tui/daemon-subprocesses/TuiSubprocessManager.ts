import type { ILogger } from "../../../application/logging/ILogger.js";
import type {
  IWorkerDaemonProcessController,
  WorkerDaemonTerminationResult,
} from "../../../application/daemons/IWorkerDaemonProcessController.js";
import {
  WORKER_DAEMON_NAMES,
} from "../../../application/daemons/WorkerDaemonCatalog.js";
import type { ISubprocessManager } from "./ISubprocessManager.js";
import type { ManagedSubprocess } from "./ManagedSubprocess.js";
import type { TuiDaemonConfig } from "./TuiDaemonConfig.js";
import type { TuiDaemonName } from "./TuiDaemonName.js";
import type { TuiSubprocessSnapshot } from "./TuiSubprocessSnapshot.js";
import { TuiDaemonOutputEventParser } from "./TuiDaemonOutputEventParser.js";
import { TuiSubprocessConfigResolver } from "./TuiSubprocessConfigResolver.js";
import {
  TuiSubprocessStatus,
  type TuiSubprocessStatusValue,
} from "./TuiSubprocessStatus.js";
import { TuiSubprocessCopy } from "./TuiSubprocessCopy.js";
import { TuiSubprocessLifecycleEventRecorder } from "./TuiSubprocessLifecycleEventRecorder.js";
import { TuiSubprocessNoOpLogger } from "./TuiSubprocessNoOpLogger.js";
import { TuiSubprocessOutputRingBuffer } from "./TuiSubprocessOutputRingBuffer.js";
import { TuiSubprocessSnapshotMapper } from "./TuiSubprocessSnapshotMapper.js";

export class TuiSubprocessManager implements ISubprocessManager {
  private readonly processes = new Map<TuiDaemonName, ManagedSubprocess>();
  private readonly configResolver = new TuiSubprocessConfigResolver();
  private readonly outputRingBuffer = new TuiSubprocessOutputRingBuffer();
  private readonly outputEventParser = new TuiDaemonOutputEventParser();
  private readonly snapshotMapper = new TuiSubprocessSnapshotMapper();
  private readonly lifecycleEventRecorder: TuiSubprocessLifecycleEventRecorder;

  constructor(
    private readonly processController: IWorkerDaemonProcessController,
    private readonly logger: ILogger = TuiSubprocessNoOpLogger,
  ) {
    this.lifecycleEventRecorder = new TuiSubprocessLifecycleEventRecorder(
      logger,
      this.outputEventParser,
    );
  }

  async spawn(name: TuiDaemonName, config: Partial<TuiDaemonConfig> = {}): Promise<TuiSubprocessSnapshot> {
    const existing = this.processes.get(name);
    if (
      existing?.status === TuiSubprocessStatus.RUNNING ||
      existing?.status === TuiSubprocessStatus.STOPPING
    ) {
      return this.snapshotMapper.fromManagedSubprocess(existing);
    }

    const resolvedConfig = this.configResolver.resolve(config);
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
      terminationTimedOut: false,
    };
    this.processes.set(name, managed);
    this.logger.info(TuiSubprocessCopy.startedLog, {
      daemon: name,
      pid: child.pid,
    });

    child.stdout?.on("data", (chunk) => {
      const text = this.outputRingBuffer.limitChunk(chunk.toString());
      const lines = this.outputRingBuffer.appendLines(managed.stdout, text);
      this.logger.info(TuiSubprocessCopy.stdoutLog, { daemon: name, text });
      const events = lines.map((line) => this.outputEventParser.parseOutputLine(name, line));
      for (const event of events) {
        this.lifecycleEventRecorder.recordDaemonEvent(managed, event);
      }
    });
    child.stderr?.on("data", (chunk) => {
      const text = this.outputRingBuffer.limitChunk(chunk.toString());
      this.outputRingBuffer.appendLines(managed.stderr, text);
      this.logger.warn(TuiSubprocessCopy.stderrLog, { daemon: name, text });
    });
    child.on("close", (code, signal) => {
      managed.exitCode = code;
      managed.exitSignal = signal;
      managed.status = this.resolveClosedStatus(managed, code);
      this.lifecycleEventRecorder.recordTerminalEvent(managed);
      this.logger.info(TuiSubprocessCopy.closedLog, {
        daemon: name,
        exitCode: code,
        signal,
        stopRequested: managed.stopRequested,
        status: managed.status,
      });
    });
    child.on("error", (error) => {
      const errorMessage = this.outputEventParser.boundTextField(error.message);
      this.outputRingBuffer.appendLines(managed.stderr, errorMessage);
      if (!managed.stopRequested || managed.terminationTimedOut) {
        managed.status = TuiSubprocessStatus.FAILED;
        this.lifecycleEventRecorder.recordTerminalEvent(managed, errorMessage);
      } else if (managed.status !== TuiSubprocessStatus.STOPPING) {
        managed.status = TuiSubprocessStatus.STOPPED;
        this.lifecycleEventRecorder.recordTerminalEvent(managed, errorMessage);
      }
      this.logger.error(TuiSubprocessCopy.errorLog, this.lifecycleEventRecorder.boundErrorForLog(error), {
        daemon: name,
        stopRequested: managed.stopRequested,
        status: managed.status,
      });
    });

    return this.snapshotMapper.fromManagedSubprocess(managed);
  }

  async terminate(name: TuiDaemonName): Promise<TuiSubprocessSnapshot> {
    const managed = this.processes.get(name);
    if (managed?.status === TuiSubprocessStatus.STOPPING && managed.termination !== undefined) {
      return managed.termination;
    }
    if (managed === undefined || managed.status !== TuiSubprocessStatus.RUNNING) {
      return this.getStatus(name);
    }

    managed.termination = this.terminateManagedSubprocess(managed);
    return managed.termination;
  }

  async terminateAll(): Promise<void> {
    await Promise.all(Array.from(this.processes.keys()).map((name) => this.terminate(name)));
  }

  getStatus(name: TuiDaemonName): TuiSubprocessSnapshot {
    const managed = this.processes.get(name);
    if (managed === undefined) {
      return this.snapshotMapper.stopped(name);
    }

    return this.snapshotMapper.fromManagedSubprocess(managed);
  }

  getAllStatuses(): readonly TuiSubprocessSnapshot[] {
    return WORKER_DAEMON_NAMES.map((name) => this.getStatus(name));
  }

  private async terminateManagedSubprocess(
    managed: ManagedSubprocess,
  ): Promise<TuiSubprocessSnapshot> {
    const name = managed.name;
    const strategy = managed.child.pid === undefined
      ? { kind: "no-pid" as const }
      : this.processController.getTerminationStrategy(managed.child);
    try {
      managed.stopRequested = true;
      managed.status = TuiSubprocessStatus.STOPPING;
      this.lifecycleEventRecorder.recordStopping(managed);
      this.logger.info(TuiSubprocessCopy.terminationRequestedLog, {
        daemon: name,
        pid: managed.child.pid,
        strategy,
      });
      const result = await this.processController.terminateDaemonProcess(managed.child);
      this.applyTerminationResult(managed, result);
    } catch (error) {
      managed.stopRequested = false;
      managed.status = TuiSubprocessStatus.FAILED;
      const errorMessage = this.outputEventParser.boundTextField(error instanceof Error ? error.message : String(error));
      this.outputRingBuffer.appendLines(managed.stderr, errorMessage);
      this.lifecycleEventRecorder.recordFailed(managed, errorMessage);
      this.logger.error(TuiSubprocessCopy.terminationFailedLog, this.lifecycleEventRecorder.boundErrorForLog(error), {
        daemon: name,
        pid: managed.child.pid,
        stopRequested: managed.stopRequested,
      });
    } finally {
      managed.termination = undefined;
    }
    return this.snapshotMapper.fromManagedSubprocess(managed);
  }

  private resolveClosedStatus(
    process: ManagedSubprocess,
    code: number | null,
  ): TuiSubprocessStatusValue {
    if (process.terminationTimedOut) {
      return TuiSubprocessStatus.FAILED;
    }

    if (process.stopRequested) {
      return TuiSubprocessStatus.STOPPED;
    }

    return code === 0 ? TuiSubprocessStatus.STOPPED : TuiSubprocessStatus.FAILED;
  }

  private applyTerminationResult(
    managed: ManagedSubprocess,
    result: WorkerDaemonTerminationResult,
  ): void {
    if (result.status === "timeout") {
      this.recordTerminationTimeout(managed, result);
      return;
    }

    if (result.status === "no-pid") {
      managed.status = TuiSubprocessStatus.STOPPED;
      this.lifecycleEventRecorder.recordStopped(managed);
    }

    if (result.status === "closed" && managed.status === TuiSubprocessStatus.STOPPING) {
      managed.exitCode = result.exitCode;
      managed.exitSignal = result.exitSignal;
      managed.status = TuiSubprocessStatus.STOPPED;
      this.lifecycleEventRecorder.recordStopped(managed);
    }

    this.logger.info(TuiSubprocessCopy.terminationCompletedLog, {
      daemon: managed.name,
      pid: managed.child.pid,
      stopRequested: managed.stopRequested,
      status: managed.status,
    });
  }

  private recordTerminationTimeout(
    managed: ManagedSubprocess,
    result: Extract<WorkerDaemonTerminationResult, { readonly status: "timeout" }>,
  ): void {
    managed.terminationTimedOut = true;
    managed.status = TuiSubprocessStatus.FAILED;
    const errorMessage = this.outputEventParser.boundTextField(
      `Timed out after ${result.timeoutMs}ms waiting for daemon process close.`,
    );
    this.outputRingBuffer.appendLines(managed.stderr, errorMessage);
    this.lifecycleEventRecorder.recordFailed(managed, errorMessage);
    this.logger.error(TuiSubprocessCopy.terminationTimedOutLog, new Error(errorMessage), {
      daemon: managed.name,
      pid: managed.child.pid,
      stopRequested: managed.stopRequested,
      timeoutMs: result.timeoutMs,
      strategy: result.strategy,
      escalation: result.escalation,
    });
  }
}
