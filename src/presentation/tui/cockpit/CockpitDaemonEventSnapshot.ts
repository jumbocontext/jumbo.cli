import type {
  TuiDaemonEventStatusValue,
} from "../daemon-subprocesses/TuiDaemonEventStatus.js";

export interface CockpitDaemonEventSnapshot {
  readonly status: TuiDaemonEventStatusValue | (string & {});
}
