export const DaemonEventStatus = {
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

export type DaemonEventStatusValue =
  (typeof DaemonEventStatus)[keyof typeof DaemonEventStatus];
