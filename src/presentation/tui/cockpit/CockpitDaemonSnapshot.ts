import type {
  TuiDaemonEventStatusValue,
  TuiSubprocessStatusValue,
} from "../daemon-subprocesses/Constants.js";

export interface CockpitDaemonSnapshot {
  readonly status: TuiSubprocessStatusValue;
  readonly events: readonly CockpitDaemonEventSnapshot[];
}

export interface CockpitDaemonEventSnapshot {
  readonly status: TuiDaemonEventStatusValue | (string & {});
}
