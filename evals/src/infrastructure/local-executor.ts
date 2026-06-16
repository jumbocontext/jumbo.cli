import { spawn } from 'node:child_process';
import { chmod, mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, join, relative } from 'node:path';
import type { ExecResult } from './container-manager.js';
import type { JumboEventSummary, WorkspaceSnapshot, WorkspaceFileEntry } from '../domain/types.js';

/**
 * Parses the event type from a Jumbo event file name of the form
 * `<seq>.<EventType>.json` (e.g. `000001.DecisionAddedEvent.json`). Names that
 * don't match are bucketed as 'unknown' rather than dropped.
 */
function parseJumboEventType(fileName: string): string {
  const match = /^\d+\.(.+)\.json$/i.exec(fileName);
  return match ? match[1] : 'unknown';
}

/**
 * Pure: builds a JumboEventSummary from event file paths relative to
 * `.jumbo/events/` (e.g. `agg-1/000001.DecisionAddedEvent.json`). The first
 * path segment is the aggregate id; the event type is parsed from the file
 * name. Counts by type are the stable signal; aggregate ids are audit-only.
 */
export function summarizeJumboEvents(
  relativeEventPaths: readonly string[],
  capturedAt: string,
): JumboEventSummary {
  const aggregates = new Set<string>();
  const countsByType: Record<string, number> = {};
  for (const rawPath of relativeEventPaths) {
    const normalized = rawPath.replace(/\\/g, '/');
    const segments = normalized.split('/');
    aggregates.add(segments[0]);
    const fileName = segments[segments.length - 1];
    const type = parseJumboEventType(fileName);
    countsByType[type] = (countsByType[type] ?? 0) + 1;
  }
  return {
    capturedAt,
    aggregateCount: aggregates.size,
    eventCount: relativeEventPaths.length,
    countsByType,
    fileNames: relativeEventPaths.map((p) => p.replace(/\\/g, '/')).sort(),
  };
}

// MSVCRT-style quoting for a single argv element passed via cmd.exe.
// Wraps in double quotes when needed and escapes embedded quotes and the
// backslashes that precede them per the standard Windows argv parser rules.
function quoteForWindowsShell(arg: string): string {
  if (arg.length === 0) return '""';
  if (!/[\s"&|<>^()!]/.test(arg)) return arg;
  let escaped = '';
  let backslashes = 0;
  for (const ch of arg) {
    if (ch === '\\') {
      backslashes++;
      continue;
    }
    if (ch === '"') {
      escaped += '\\'.repeat(backslashes * 2 + 1) + '"';
    } else {
      escaped += '\\'.repeat(backslashes) + ch;
    }
    backslashes = 0;
  }
  escaped += '\\'.repeat(backslashes * 2);
  return `"${escaped}"`;
}

/**
 * Executes harness CLI commands locally using child_process.spawn
 * with temp directory isolation for each run variant.
 *
 * Replaces ContainerManager for environments where agent CLIs
 * require host-level authentication (OAuth, config files in ~/).
 */
export class LocalExecutor {
  /**
   * Creates a temp working directory for an eval run.
   * Each variant (Jumbo, baseline) gets its own directory.
   */
  async createWorkDir(prefix: string = 'jumbo-eval-'): Promise<string> {
    return mkdtemp(join(tmpdir(), prefix));
  }

  /**
   * Executes a command in the given working directory.
   * Returns stdout, stderr, and exit code.
   *
   * When `options.stdin` is provided, the bytes are written to the child's
   * stdin and the stream is closed. This is the only safe channel for
   * multi-line payloads on Windows: argv strings on Windows are routed
   * through `cmd.exe /d /s /c "<joined>"`, and cmd.exe truncates the command
   * string at the first embedded newline. Anything multi-line (Jumbo context
   * wrappers, scenario continuation prompts, disruption injections) must go
   * through stdin, not argv.
   */
  async exec(
    workDir: string,
    command: string[],
    options?: { stdin?: string; env?: Record<string, string | undefined> },
  ): Promise<ExecResult> {
    const isWindows = process.platform === 'win32';
    const [cmd, ...args] = command;
    const stdinPayload = options?.stdin;
    const env = options?.env
      ? { ...process.env, ...options.env }
      : { ...process.env };

    return new Promise<ExecResult>((resolve) => {
      // On Windows, jumbo/claude/npm are .cmd shims that require shell: true to
      // execute (Node CVE-2024-27980). When shell is enabled, spawn concatenates
      // argv with spaces and offers no escaping — passing summaries with spaces,
      // quotes, or JSON would word-split. So we pre-quote into a single command
      // string. On POSIX, real argv works fine without a shell.
      const child = isWindows
        ? spawn([cmd, ...args].map(quoteForWindowsShell).join(' '), {
            cwd: workDir,
            env,
            shell: true,
            stdio: ['pipe', 'pipe', 'pipe'],
          })
        : spawn(cmd, args, {
            cwd: workDir,
            env,
            shell: false,
            stdio: ['pipe', 'pipe', 'pipe'],
          });

      const stdoutChunks: Buffer[] = [];
      const stderrChunks: Buffer[] = [];

      child.stdout.on('data', (chunk: Buffer) => stdoutChunks.push(chunk));
      child.stderr.on('data', (chunk: Buffer) => stderrChunks.push(chunk));

      child.on('close', (code) => {
        resolve({
          stdout: Buffer.concat(stdoutChunks).toString('utf-8'),
          stderr: Buffer.concat(stderrChunks).toString('utf-8'),
          exitCode: code ?? 1,
        });
      });

      child.on('error', (err) => {
        resolve({
          stdout: '',
          stderr: err.message,
          exitCode: 1,
        });
      });

      if (stdinPayload !== undefined) {
        child.stdin.on('error', () => {
          // Child may close stdin before we finish writing; ignore EPIPE.
        });
        child.stdin.end(stdinPayload, 'utf-8');
      } else {
        child.stdin.end();
      }
    });
  }

  /**
   * Installs a fail-loud `jumbo` shim inside the given working directory and
   * returns an env override whose PATH puts the shim ahead of the real
   * binary. Used to enforce baseline-arm parity: the baseline agent must not
   * be able to reach the real jumbo CLI, but any attempt to invoke it must
   * fail loudly with a recognizable marker rather than silently succeeding
   * against an unrelated binary.
   */
  async installJumboShim(workDir: string): Promise<{ env: Record<string, string> }> {
    const shimDir = join(workDir, '.eval-bin');
    await mkdir(shimDir, { recursive: true });
    const marker = 'ERROR: jumbo is not available in the baseline arm (eval shim)';
    if (process.platform === 'win32') {
      const batch = `@echo off\r\necho ${marker} 1>&2\r\nexit /b 127\r\n`;
      await writeFile(join(shimDir, 'jumbo.cmd'), batch);
      await writeFile(join(shimDir, 'jumbo.bat'), batch);
    } else {
      const script = `#!/bin/sh\necho "${marker}" >&2\nexit 127\n`;
      const target = join(shimDir, 'jumbo');
      await writeFile(target, script);
      await chmod(target, 0o755);
    }
    const PATH = `${shimDir}${delimiter}${process.env.PATH ?? ''}`;
    return { env: { PATH } };
  }

  /**
   * Captures a snapshot of all readable text files in the working directory.
   * Workspace content is the primary evidence source for scoring.
   */
  async captureWorkspaceSnapshot(workDir: string): Promise<WorkspaceSnapshot> {
    const files: WorkspaceFileEntry[] = [];
    await this.walkDir(workDir, workDir, files);
    const jumboEvents = await this.captureJumboEventSummary(workDir);
    return {
      capturedAt: new Date().toISOString(),
      files,
      ...(jumboEvents ? { jumboEvents } : {}),
    };
  }

  /**
   * Summarizes Jumbo's own event log (`.jumbo/events/`) as scoring evidence —
   * file names and aggregate counts by event type, never event content. The
   * `.jumbo` directory is deliberately excluded from the file-content walk
   * (see SKIP_DIRS); this is the only place it is read.
   *
   * Returns undefined when there is no `.jumbo/events/` directory (the baseline
   * arm), distinguishing "no Jumbo" from "Jumbo present but no events yet"
   * (which yields a zero-count summary).
   */
  private async captureJumboEventSummary(workDir: string): Promise<JumboEventSummary | undefined> {
    const eventsDir = join(workDir, '.jumbo', 'events');
    const relativePaths: string[] = [];
    try {
      await this.collectEventFiles(eventsDir, eventsDir, relativePaths);
    } catch {
      return undefined;
    }
    return summarizeJumboEvents(relativePaths, new Date().toISOString());
  }

  private async collectEventFiles(rootDir: string, currentDir: string, out: string[]): Promise<void> {
    const entries = await readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await this.collectEventFiles(rootDir, fullPath, out);
      } else if (entry.isFile()) {
        out.push(relative(rootDir, fullPath).replace(/\\/g, '/'));
      }
    }
  }

  /**
   * Returns the sorted set of file paths added or whose content changed
   * between two workspace snapshots. Files removed in `after` are ignored —
   * filesModified semantics target what the agent created or edited.
   * Pure: deterministic given inputs, no I/O.
   */
  static diffWorkspaceSnapshots(
    before: WorkspaceSnapshot | undefined,
    after: WorkspaceSnapshot,
  ): string[] {
    const beforeMap = new Map<string, string>();
    for (const f of before?.files ?? []) {
      beforeMap.set(f.path, f.content);
    }
    const changed: string[] = [];
    for (const f of after.files) {
      const prior = beforeMap.get(f.path);
      if (prior === undefined || prior !== f.content) {
        changed.push(f.path);
      }
    }
    return changed.sort();
  }

  // Filenames and patterns that may contain secrets — never captured in snapshots.
  private static readonly SECRET_PRONE_PATTERNS: RegExp[] = [
    /^\.env(\.[^/]*)?$/,
    /\.(key|pem|p12|pfx|crt|cert|jks|keystore)$/i,
    /^(credentials?|secrets?|api[_-]?keys?)(\.(json|yaml|yml|toml|ini|txt))?$/i,
    /^(id_rsa|id_dsa|id_ecdsa|id_ed25519)(\.pub)?$/,
  ];

  private isSecretProneFilename(filename: string): boolean {
    return LocalExecutor.SECRET_PRONE_PATTERNS.some((re) => re.test(filename));
  }

  private async walkDir(rootDir: string, currentDir: string, files: WorkspaceFileEntry[]): Promise<void> {
    const SKIP_DIRS = new Set(['.git', 'node_modules', '.jumbo', 'dist', '.cache']);
    const MAX_FILE_BYTES = 100_000;

    let entries;
    try {
      entries = await readdir(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);
      const relativePath = relative(rootDir, fullPath).replace(/\\/g, '/');

      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) {
          await this.walkDir(rootDir, fullPath, files);
        }
      } else if (entry.isFile()) {
        if (this.isSecretProneFilename(entry.name)) {
          continue;
        }
        try {
          const info = await stat(fullPath);
          if (info.size <= MAX_FILE_BYTES) {
            const content = await readFile(fullPath, 'utf-8');
            files.push({ path: relativePath, content });
          }
        } catch {
          // skip unreadable or binary files
        }
      }
    }
  }

  /**
   * Removes a temp working directory and all its contents.
   */
  async cleanup(workDir: string): Promise<void> {
    try {
      await rm(workDir, { recursive: true, force: true });
    } catch {
      // Directory may already be removed
    }
  }
}
