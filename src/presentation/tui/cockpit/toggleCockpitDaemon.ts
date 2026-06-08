import { CockpitDaemonEvents } from "./CockpitDaemonEvents.js";
import type { DaemonEventRow } from "./DaemonEventRow.js";
import type {
  ISubprocessManager,
  TuiDaemonConfig,
  TuiDaemonName,
  TuiSubprocessSnapshot,
} from "../daemon-subprocesses/ISubprocessManager.js";
import { TuiSubprocessStatus } from "../daemon-subprocesses/TuiSubprocessStatus.js";

export async function toggleCockpitDaemon(
  name: TuiDaemonName,
  manager: ISubprocessManager,
  config: TuiDaemonConfig,
  setDaemonStatuses: (statuses: readonly TuiSubprocessSnapshot[]) => void,
  setDaemonEventRows: (update: (currentRows: readonly DaemonEventRow[]) => readonly DaemonEventRow[]) => void,
): Promise<void> {
  const snapshot = manager.getStatus(name);
  if (snapshot.status === TuiSubprocessStatus.RUNNING) {
    await manager.terminate(name);
  } else if (snapshot.status !== TuiSubprocessStatus.STOPPING) {
    await manager.spawn(name, config);
  }
  const snapshots = manager.getAllStatuses();
  setDaemonStatuses(snapshots);
  setDaemonEventRows((currentRows) =>
    CockpitDaemonEvents.appendRows(
      currentRows,
      CockpitDaemonEvents.getRows(snapshots, Date.now()),
    )
  );
}
