import { DEFAULT_WORKER_DAEMON_CONFIG } from "../../../application/daemons/WorkerDaemonCatalog.js";
import type {
  TuiDaemonName,
  TuiSubprocessSnapshot,
} from "../daemon-subprocesses/ISubprocessManager.js";
import { TuiSubprocessStatus } from "../daemon-subprocesses/TuiSubprocessStatus.js";

export const DaemonStatusFinder = {
  find,
} as const;

function find(
  statuses: readonly TuiSubprocessSnapshot[],
  name: TuiDaemonName,
): TuiSubprocessSnapshot {
  return statuses.find((status) => status.name === name) ?? {
    name,
    status: TuiSubprocessStatus.STOPPED,
    config: DEFAULT_WORKER_DAEMON_CONFIG,
    stdout: [],
    stderr: [],
    events: [],
  };
}
