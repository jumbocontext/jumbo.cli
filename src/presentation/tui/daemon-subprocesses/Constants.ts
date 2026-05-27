export const TuiSubprocessStatus = {
  STOPPED: "stopped",
  RUNNING: "running",
  FAILED: "failed",
} as const;

export type TuiSubprocessStatusValue =
  (typeof TuiSubprocessStatus)[keyof typeof TuiSubprocessStatus];

export const TuiDaemonEventStatus = {
  STARTING: "starting",
  STOPPING: "stopping",
  STOPPED: "stopped",
  FAILED: "failed",
  IDLE: "idle",
  PROCESSING: "processing",
  COMPLETED: "completed",
  SKIPPED: "skipped",
  EXHAUSTED: "exhausted",
  CODIFYING: "codifying",
} as const;

export type TuiDaemonEventStatusValue =
  (typeof TuiDaemonEventStatus)[keyof typeof TuiDaemonEventStatus];

export const TuiDaemonEventCategory = {
  MODEL_OUTPUT: "model-output",
  STOPPING: TuiDaemonEventStatus.STOPPING,
  STOPPED: TuiDaemonEventStatus.STOPPED,
  FAILED: TuiDaemonEventStatus.FAILED,
} as const;

export const TuiSubprocessCopy = {
  terminationRequested: "termination requested",
  processStopped: "process stopped",
  processFailed: "process failed",
  spawnRequestedLog: "Daemon subprocess spawn requested",
  startedLog: "Daemon subprocess started",
  stdoutLog: "Daemon subprocess stdout",
  stderrLog: "Daemon subprocess stderr",
  closedLog: "Daemon subprocess closed",
  errorLog: "Daemon subprocess error",
  terminationRequestedLog: "Daemon subprocess termination requested",
  terminationCompletedLog: "Daemon subprocess termination completed",
  terminationFailedLog: "Daemon subprocess termination failed",
  eventLog: "Daemon subprocess event",
} as const;
