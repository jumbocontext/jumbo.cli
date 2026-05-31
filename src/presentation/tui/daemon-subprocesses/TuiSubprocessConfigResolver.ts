import { DEFAULT_WORKER_DAEMON_CONFIG } from "../../../application/daemons/WorkerDaemonCatalog.js";
import type { TuiDaemonConfig } from "./TuiDaemonConfig.js";

export class TuiSubprocessConfigResolver {
  resolve(config: Partial<TuiDaemonConfig>): TuiDaemonConfig {
    return {
      agentId: config.agentId ?? DEFAULT_WORKER_DAEMON_CONFIG.agentId,
      pollIntervalMs: config.pollIntervalMs ?? DEFAULT_WORKER_DAEMON_CONFIG.pollIntervalMs,
      maxRetries: config.maxRetries ?? DEFAULT_WORKER_DAEMON_CONFIG.maxRetries,
    };
  }
}
