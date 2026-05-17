import { ISubprocessManager, TuiDaemonConfig, TuiDaemonName, TuiSubprocessSnapshot } from "./ISubprocessManager.js";

const DEFAULT_DAEMON_CONFIG: TuiDaemonConfig = {
  agentId: "codex",
  pollIntervalMs: 30_000,
  maxRetries: 3,
};

export class NoOpSubprocessManager implements ISubprocessManager {
  private readonly snapshots: Map<TuiDaemonName, TuiSubprocessSnapshot> = new Map([
    ["reviewer", this.createStoppedSnapshot("reviewer")],
    ["refiner", this.createStoppedSnapshot("refiner")],
    ["codifier", this.createStoppedSnapshot("codifier")],
  ]);

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
      config: DEFAULT_DAEMON_CONFIG,
      stdout: [],
      stderr: [],
      events: [],
    };
  }
}
