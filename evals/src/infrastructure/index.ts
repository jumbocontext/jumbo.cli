export { LocalExecutor } from './local-executor.js';
export { StoreHeartbeatWriter } from './heartbeat-writer.js';
export type { HeartbeatWriter } from './heartbeat-writer.js';
export type { ExecResult } from './container-manager.js';

/** @deprecated Use LocalExecutor instead — Docker containers cannot authenticate agent CLIs */
export { ContainerManager } from './container-manager.js';
export type { ContainerConfig } from './container-manager.js';
