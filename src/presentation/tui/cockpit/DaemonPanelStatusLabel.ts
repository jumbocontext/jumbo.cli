import {
  TuiDaemonEventStatus,
  TuiSubprocessStatus,
} from "../daemon-subprocesses/Constants.js";
import type { CockpitDaemonSnapshot } from "./CockpitDaemonSnapshot.js";
import type { IDaemonConstants } from "./daemons/IDaemonConstants.js";

export function getDaemonPanelStatusLabel(
  snapshot: CockpitDaemonSnapshot,
  daemonConstants: IDaemonConstants,
): string {
  const latestEvent = snapshot.events[snapshot.events.length - 1];
  if (
    snapshot.status === TuiSubprocessStatus.RUNNING &&
    latestEvent?.status === TuiDaemonEventStatus.IDLE
  ) {
    return `[ ${daemonConstants.idleVerb} ]`;
  }

  const status =
    snapshot.status === TuiSubprocessStatus.RUNNING
      ? daemonConstants.activeVerb
      : snapshot.status;

  return `[ ${status} ]`;
}
