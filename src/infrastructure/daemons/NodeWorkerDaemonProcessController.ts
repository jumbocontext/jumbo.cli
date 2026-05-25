import { spawn, execFile } from "node:child_process";
import path from "path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import type { WorkerDaemonConfig, WorkerDaemonName } from "../../application/daemons/WorkerDaemonCatalog.js";
import type {
  IWorkerDaemonProcessController,
  WorkerDaemonProcess,
  WorkerDaemonTerminationStrategy,
} from "../../application/daemons/IWorkerDaemonProcessController.js";

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PRESENTATION_WORK_DAEMON_DIRECTORY_SEGMENTS = ["..", "..", "presentation", "work"] as const;

export class NodeWorkerDaemonProcessController implements IWorkerDaemonProcessController {
  spawnDaemonProcess(
    name: WorkerDaemonName,
    config: WorkerDaemonConfig,
  ): WorkerDaemonProcess {
    return spawn(process.execPath, [
      this.resolveDaemonTarget(name),
      "--agent",
      config.agentId,
      "--poll-interval-ms",
      String(config.pollIntervalMs),
      "--max-retries",
      String(config.maxRetries),
    ], {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
      detached: process.platform !== "win32",
    });
  }

  async terminateDaemonProcess(process: WorkerDaemonProcess): Promise<void> {
    const strategy = this.getTerminationStrategy(process);
    if (strategy.kind === "no-pid") {
      return;
    }

    if (strategy.kind === "windows-tree") {
      await execFileAsync(strategy.command, [...strategy.args]);
      return;
    }

    globalThis.process.kill(strategy.pid, strategy.signal);
  }

  getTerminationStrategy(process: WorkerDaemonProcess): WorkerDaemonTerminationStrategy {
    if (process.pid === undefined) {
      return { kind: "no-pid" };
    }

    return getNodeWorkerDaemonTerminationStrategy(globalThis.process.platform, process.pid);
  }

  private resolveDaemonTarget(name: WorkerDaemonName): string {
    return path.resolve(
      __dirname,
      ...PRESENTATION_WORK_DAEMON_DIRECTORY_SEGMENTS,
      `${name}.daemon.js`,
    );
  }
}

export function getNodeWorkerDaemonTerminationStrategy(
  platform: NodeJS.Platform,
  pid: number,
): Exclude<WorkerDaemonTerminationStrategy, { readonly kind: "no-pid" }> {
  if (platform === "win32") {
    return {
      kind: "windows-tree",
      command: "taskkill",
      args: ["/F", "/T", "/PID", String(pid)],
    };
  }

  return { kind: "unix-process-group", signal: "SIGTERM", pid: -pid };
}
