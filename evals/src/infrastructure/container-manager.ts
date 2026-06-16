import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface ContainerConfig {
  readonly image: string;
  readonly name: string;
  readonly envVars?: Readonly<Record<string, string>>;
  readonly workspaceVolume?: string;
}

export interface ExecResult {
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: number;
}

/**
 * @deprecated Use LocalExecutor instead. Docker containers cannot authenticate
 * agent CLIs (claude, codex, gemini) which require host-level OAuth/config files.
 *
 * Manages Docker container lifecycle for eval workspaces.
 * Each test run gets a persistent container; sessions are
 * fresh harness invocations inside the same container.
 */
export class ContainerManager {
  async create(config: ContainerConfig): Promise<string> {
    const args = [
      'create',
      '--name', config.name,
      '--interactive',
    ];

    if (config.envVars) {
      for (const [key, value] of Object.entries(config.envVars)) {
        args.push('--env', `${key}=${value}`);
      }
    }

    if (config.workspaceVolume) {
      args.push('--volume', `${config.workspaceVolume}:/workspace`);
      args.push('--workdir', '/workspace');
    }

    args.push(config.image);

    const { stdout } = await execFileAsync('docker', args);
    return stdout.trim();
  }

  async start(containerName: string): Promise<void> {
    await execFileAsync('docker', ['start', containerName]);
  }

  async exec(containerName: string, command: string[]): Promise<ExecResult> {
    try {
      const { stdout, stderr } = await execFileAsync('docker', [
        'exec', containerName, ...command,
      ], { maxBuffer: 10 * 1024 * 1024 });

      return { stdout, stderr, exitCode: 0 };
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'stdout' in err && 'stderr' in err && 'code' in err) {
        const execErr = err as { stdout: string; stderr: string; code: number };
        return {
          stdout: execErr.stdout ?? '',
          stderr: execErr.stderr ?? '',
          exitCode: execErr.code,
        };
      }
      throw err;
    }
  }

  async stop(containerName: string): Promise<void> {
    await execFileAsync('docker', ['stop', containerName]);
  }

  async destroy(containerName: string): Promise<void> {
    try {
      await execFileAsync('docker', ['rm', '--force', containerName]);
    } catch {
      // Container may already be removed
    }
  }

  async isRunning(containerName: string): Promise<boolean> {
    try {
      const { stdout } = await execFileAsync('docker', [
        'inspect', '--format', '{{.State.Running}}', containerName,
      ]);
      return stdout.trim() === 'true';
    } catch {
      return false;
    }
  }
}
