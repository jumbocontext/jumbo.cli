import type { CockpitDaemonEventSnapshot } from "./CockpitDaemonEventSnapshot.js";
import type {
  TuiSubprocessStatusValue,
} from "../daemon-subprocesses/TuiSubprocessStatus.js";

export interface CockpitDaemonSnapshot {
  readonly status: TuiSubprocessStatusValue;
  readonly events: readonly CockpitDaemonEventSnapshot[];
}
