export type {
  WorkerDaemonConfig as TuiDaemonConfig,
  WorkerDaemonConfigs as TuiDaemonConfigs,
  WorkerDaemonName as TuiDaemonName,
} from "../../../application/daemons/WorkerDaemonCatalog.js";

import type {
  WorkerDaemonConfig as TuiDaemonConfig,
  WorkerDaemonName as TuiDaemonName,
} from "../../../application/daemons/WorkerDaemonCatalog.js";

export type TuiSubprocessStatus = "stopped" | "running" | "failed";
export type TuiDaemonEventStatus =
  | "starting"
  | "stopping"
  | "stopped"
  | "failed"
  | "idle"
  | "processing"
  | "completed"
  | "skipped"
  | "exhausted"
  | "codifying";

export interface TuiDaemonEventSnapshot {
  readonly daemon: string;
  readonly status: TuiDaemonEventStatus | (string & {});
  readonly source?: string;
  readonly category?: string;
  readonly message?: string;
  readonly timestampMs?: number;
  readonly goalId?: string;
  readonly attempt?: number;
  readonly maxRetries?: number;
  readonly exitCode?: number;
  readonly errorMessage?: string;
}

export interface TuiSubprocessSnapshot {
  readonly name: TuiDaemonName;
  readonly status: TuiSubprocessStatus;
  readonly config: TuiDaemonConfig;
  readonly pid?: number;
  readonly stdout: readonly string[];
  readonly stderr: readonly string[];
  readonly events: readonly TuiDaemonEventSnapshot[];
  readonly exitCode?: number | null;
  readonly exitSignal?: string | null;
  readonly stopRequested?: boolean;
}

export interface TuiDaemonCounts {
  readonly running: number;
  readonly stopped: number;
  readonly failed: number;
}

export interface ISubprocessManager {
  spawn(name: TuiDaemonName, config?: Partial<TuiDaemonConfig>): Promise<TuiSubprocessSnapshot>;
  terminate(name: TuiDaemonName): Promise<TuiSubprocessSnapshot>;
  terminateAll(): Promise<void>;
  getStatus(name: TuiDaemonName): TuiSubprocessSnapshot;
  getAllStatuses(): readonly TuiSubprocessSnapshot[];
}
