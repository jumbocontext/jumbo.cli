export const SubprocessStatus = {
  STOPPED: "stopped",
  RUNNING: "running",
  STOPPING: "stopping",
  FAILED: "failed",
} as const;

export type SubprocessStatusValue =
  (typeof SubprocessStatus)[keyof typeof SubprocessStatus];
