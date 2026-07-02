import { DaemonEventStatus } from "./DaemonEventStatus.js";

export const DaemonEventCategory = {
  MODEL_OUTPUT: "model-output",
  STOPPING: DaemonEventStatus.STOPPING,
  STOPPED: DaemonEventStatus.STOPPED,
  FAILED: DaemonEventStatus.FAILED,
} as const;
