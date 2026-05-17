export type TuiDaemonName = "reviewer" | "refiner" | "codifier";
export type TuiSubprocessStatus = "stopped" | "running" | "failed";

export interface TuiDaemonConfig {
  readonly agentId: string;
  readonly pollIntervalMs: number;
  readonly maxRetries: number;
}

export interface TuiDaemonEventSnapshot {
  readonly daemon: string;
  readonly status: string;
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
