import { ISubprocessManager, TuiDaemonName, TuiSubprocessSnapshot } from "./ISubprocessManager.js";
import {
  DEFAULT_WORKER_DAEMON_CONFIG,
  WORKER_DAEMON_NAMES,
} from "../../../application/daemons/WorkerDaemonCatalog.js";

export class NoOpSubprocessManager implements ISubprocessManager {
  private readonly snapshots: Map<TuiDaemonName, TuiSubprocessSnapshot> = new Map(
    WORKER_DAEMON_NAMES.map((name) => [name, this.createStoppedSnapshot(name)]),
  );

  async spawn(name: TuiDaemonName): Promise<TuiSubprocessSnapshot> {
    return this.getStatus(name);
  }

  async terminate(name: TuiDaemonName): Promise<TuiSubprocessSnapshot> {
    return this.getStatus(name);
  }

  async terminateAll(): Promise<void> {}

  getStatus(name: TuiDaemonName): TuiSubprocessSnapshot {
    return this.snapshots.get(name) ?? this.createStoppedSnapshot(name);
  }

  getAllStatuses(): readonly TuiSubprocessSnapshot[] {
    return Array.from(this.snapshots.values());
  }

  private createStoppedSnapshot(name: TuiDaemonName): TuiSubprocessSnapshot {
    return {
      name,
      status: "stopped",
      config: DEFAULT_WORKER_DAEMON_CONFIG,
      stdout: [],
      stderr: [],
      events: [],
    };
  }
}
