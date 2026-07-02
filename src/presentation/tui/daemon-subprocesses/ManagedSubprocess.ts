import type { WorkerDaemonProcess } from "../../../application/daemons/IWorkerDaemonProcessController.js";
import type { DaemonConfig } from "./DaemonConfig.js";
import type { DaemonEventSnapshot } from "./DaemonEventSnapshot.js";
import type { DaemonName } from "./DaemonName.js";
import type { SubprocessSnapshot } from "./SubprocessSnapshot.js";
import type { SubprocessStatusValue } from "./SubprocessStatus.js";

export interface ManagedSubprocess {
  readonly name: DaemonName;
  readonly child: WorkerDaemonProcess;
  readonly config: DaemonConfig;
  readonly stdout: string[];
  readonly stderr: string[];
  readonly events: DaemonEventSnapshot[];
  status: SubprocessStatusValue;
  exitCode?: number | null;
  exitSignal?: string | null;
  stopRequested: boolean;
  terminationTimedOut: boolean;
  termination?: Promise<SubprocessSnapshot>;
}
