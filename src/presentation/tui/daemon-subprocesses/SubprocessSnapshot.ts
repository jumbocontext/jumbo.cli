import type { DaemonConfig } from "./DaemonConfig.js";
import type { DaemonEventSnapshot } from "./DaemonEventSnapshot.js";
import type { DaemonName } from "./DaemonName.js";
import type { SubprocessStatusValue } from "./SubprocessStatus.js";

export interface SubprocessSnapshot {
  readonly name: DaemonName;
  readonly status: SubprocessStatusValue;
  readonly config: DaemonConfig;
  readonly pid?: number;
  readonly stdout: readonly string[];
  readonly stderr: readonly string[];
  readonly events: readonly DaemonEventSnapshot[];
  readonly exitCode?: number | null;
  readonly exitSignal?: string | null;
  readonly stopRequested?: boolean;
  readonly terminationTimedOut?: boolean;
}
