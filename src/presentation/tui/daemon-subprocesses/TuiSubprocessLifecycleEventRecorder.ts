import type { ILogger } from "../../../application/logging/ILogger.js";
import type { ManagedSubprocess } from "./ManagedSubprocess.js";
import { TuiDaemonEventCategory } from "./TuiDaemonEventCategory.js";
import type { TuiDaemonEventSnapshot } from "./TuiDaemonEventSnapshot.js";
import { TuiDaemonEventStatus } from "./TuiDaemonEventStatus.js";
import { TuiSubprocessCopy } from "./TuiSubprocessCopy.js";
import { TuiSubprocessStatus } from "./TuiSubprocessStatus.js";
import { TuiDaemonOutputEventParser } from "./TuiDaemonOutputEventParser.js";

const EVENT_RING_BUFFER_SIZE = 50;

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

export class TuiSubprocessLifecycleEventRecorder {
  constructor(
    private readonly logger: ILogger,
    private readonly outputEventParser = new TuiDaemonOutputEventParser(),
  ) {}

  recordStopping(process: ManagedSubprocess): void {
    this.recordLifecycleEvent(process, {
      status: TuiDaemonEventStatus.STOPPING,
      ...SUBPROCESS_EVENT_COPY.stopping,
    });
  }

  recordStopped(process: ManagedSubprocess): void {
    this.recordLifecycleEvent(process, {
      status: TuiDaemonEventStatus.STOPPED,
      ...SUBPROCESS_EVENT_COPY.stopped,
    });
  }

  recordFailed(process: ManagedSubprocess, errorMessage: string): void {
    this.recordLifecycleEvent(process, {
      status: TuiDaemonEventStatus.FAILED,
      errorMessage,
      ...SUBPROCESS_EVENT_COPY.failed,
    });
  }

  recordTerminalEvent(
    process: ManagedSubprocess,
    errorMessage = process.stderr[process.stderr.length - 1],
  ): void {
    const status = process.status === TuiSubprocessStatus.STOPPED
      ? TuiDaemonEventStatus.STOPPED
      : TuiDaemonEventStatus.FAILED;
    this.recordLifecycleEvent(process, {
      status,
      exitCode: process.exitCode ?? undefined,
      errorMessage: status === TuiDaemonEventStatus.FAILED ? errorMessage : undefined,
      ...(status === TuiDaemonEventStatus.STOPPED ? SUBPROCESS_EVENT_COPY.stopped : SUBPROCESS_EVENT_COPY.failed),
    });
  }

  recordDaemonEvent(
    process: ManagedSubprocess,
    event: TuiDaemonEventSnapshot,
  ): void {
    const boundedEvent = this.outputEventParser.boundEvent(event);
    this.logger.info(TuiSubprocessCopy.eventLog, { daemon: process.name, event: boundedEvent });
    process.events.push(boundedEvent);
    while (process.events.length > EVENT_RING_BUFFER_SIZE) {
      process.events.shift();
    }
  }

  boundErrorForLog(error: unknown): unknown {
    if (!(error instanceof Error)) {
      return error;
    }

    const bounded = new Error(this.outputEventParser.boundTextField(error.message));
    bounded.name = error.name;
    bounded.stack = this.outputEventParser.boundOptionalTextField(error.stack);
    return bounded;
  }

  private recordLifecycleEvent(
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
}
