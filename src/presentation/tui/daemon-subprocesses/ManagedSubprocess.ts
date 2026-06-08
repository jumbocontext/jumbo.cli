import type { WorkerDaemonProcess } from "../../../application/daemons/IWorkerDaemonProcessController.js";
import type { TuiDaemonConfig } from "./TuiDaemonConfig.js";
import type { TuiDaemonEventSnapshot } from "./TuiDaemonEventSnapshot.js";
import type { TuiDaemonName } from "./TuiDaemonName.js";
import type { TuiSubprocessSnapshot } from "./TuiSubprocessSnapshot.js";
import type { TuiSubprocessStatusValue } from "./TuiSubprocessStatus.js";

export interface ManagedSubprocess {
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
  terminationTimedOut: boolean;
  termination?: Promise<TuiSubprocessSnapshot>;
}
