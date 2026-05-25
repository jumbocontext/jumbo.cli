import type { WorkerDaemonConfig, WorkerDaemonName } from "./WorkerDaemonCatalog.js";

export type WorkerDaemonTerminationStrategy =
  | {
      readonly kind: "windows-tree";
      readonly command: "taskkill";
      readonly args: readonly string[];
    }
  | {
      readonly kind: "unix-process-group";
      readonly signal: "SIGTERM";
      readonly pid: number;
    }
  | {
      readonly kind: "no-pid";
    };

export interface WorkerDaemonOutputStream {
  on(event: "data", listener: (chunk: { toString(): string }) => void): this;
}

export interface WorkerDaemonProcess {
  readonly pid?: number;
  readonly stdout?: WorkerDaemonOutputStream;
  readonly stderr?: WorkerDaemonOutputStream;
  on(event: "close", listener: (code: number | null, signal: string | null) => void): this;
  on(event: "error", listener: (error: Error) => void): this;
}

export interface IWorkerDaemonProcessController {
  spawnDaemonProcess(
    name: WorkerDaemonName,
    config: WorkerDaemonConfig,
  ): WorkerDaemonProcess;
  terminateDaemonProcess(process: WorkerDaemonProcess): Promise<void>;
  getTerminationStrategy(process: WorkerDaemonProcess): WorkerDaemonTerminationStrategy;
}
