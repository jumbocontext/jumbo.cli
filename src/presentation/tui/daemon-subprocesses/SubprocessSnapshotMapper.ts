import { DEFAULT_WORKER_DAEMON_CONFIG } from "../../../application/daemons/WorkerDaemonCatalog.js";
import type { ManagedSubprocess } from "./ManagedSubprocess.js";
import type { DaemonName } from "./DaemonName.js";
import type { SubprocessSnapshot } from "./SubprocessSnapshot.js";
import { SubprocessStatus } from "./SubprocessStatus.js";

export class SubprocessSnapshotMapper {
  stopped(name: DaemonName): SubprocessSnapshot {
    return {
      name,
      status: SubprocessStatus.STOPPED,
      config: DEFAULT_WORKER_DAEMON_CONFIG,
      stdout: [],
      stderr: [],
      events: [],
    };
  }

  fromManagedSubprocess(process: ManagedSubprocess): SubprocessSnapshot {
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
