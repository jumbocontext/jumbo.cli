import { DaemonEventStatus } from "./DaemonEventStatus.js";

export const DaemonEventCategory = {
  MODEL_OUTPUT: "model-output",
  STDERR: "stderr",
  HEARTBEAT: "heartbeat",
  STOPPING: DaemonEventStatus.STOPPING,
  STOPPED: DaemonEventStatus.STOPPED,
  FAILED: DaemonEventStatus.FAILED,
} as const;
