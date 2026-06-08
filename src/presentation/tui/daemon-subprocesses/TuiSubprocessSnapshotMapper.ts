import { DEFAULT_WORKER_DAEMON_CONFIG } from "../../../application/daemons/WorkerDaemonCatalog.js";
import type { ManagedSubprocess } from "./ManagedSubprocess.js";
import type { TuiDaemonName } from "./TuiDaemonName.js";
import type { TuiSubprocessSnapshot } from "./TuiSubprocessSnapshot.js";
import { TuiSubprocessStatus } from "./TuiSubprocessStatus.js";

export class TuiSubprocessSnapshotMapper {
  stopped(name: TuiDaemonName): TuiSubprocessSnapshot {
    return {
      name,
      status: TuiSubprocessStatus.STOPPED,
      config: DEFAULT_WORKER_DAEMON_CONFIG,
      stdout: [],
      stderr: [],
      events: [],
    };
  }

  fromManagedSubprocess(process: ManagedSubprocess): TuiSubprocessSnapshot {
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
      terminationTimedOut: process.terminationTimedOut,
    };
  }
}
