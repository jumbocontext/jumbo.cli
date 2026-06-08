import type { TuiDaemonConfig } from "./TuiDaemonConfig.js";
import type { TuiDaemonEventSnapshot } from "./TuiDaemonEventSnapshot.js";
import type { TuiDaemonName } from "./TuiDaemonName.js";
import type { TuiSubprocessStatusValue } from "./TuiSubprocessStatus.js";

export interface TuiSubprocessSnapshot {
  readonly name: TuiDaemonName;
  readonly status: TuiSubprocessStatusValue;
  readonly config: TuiDaemonConfig;
  readonly pid?: number;
  readonly stdout: readonly string[];
  readonly stderr: readonly string[];
  readonly events: readonly TuiDaemonEventSnapshot[];
  readonly exitCode?: number | null;
  readonly exitSignal?: string | null;
  readonly stopRequested?: boolean;
  readonly terminationTimedOut?: boolean;
}
