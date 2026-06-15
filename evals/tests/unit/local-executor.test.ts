import { describe, it, expect } from '@jest/globals';
import { LocalExecutor } from '../../src/infrastructure/local-executor.js';
import { existsSync } from 'node:fs';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

describe('LocalExecutor', () => {
  const executor = new LocalExecutor();

  it('creates a temp working directory', async () => {
    const workDir = await executor.createWorkDir('test-exec-');
    expect(workDir).toBeTruthy();
    expect(existsSync(workDir)).toBe(true);
    await executor.cleanup(workDir);
  });

  it('creates unique directories per call', async () => {
    const dir1 = await executor.createWorkDir('test-unique-');
    const dir2 = await executor.createWorkDir('test-unique-');
    expect(dir1).not.toBe(dir2);
    await executor.cleanup(dir1);
    await executor.cleanup(dir2);
  });

  it('executes a command with cwd and captures stdout', async () => {
    const workDir = await executor.createWorkDir('test-exec-');
    const result = await executor.exec(workDir, ['echo', 'hello']);

    expect(result.stdout.trim()).toBe('hello');
    expect(result.exitCode).toBe(0);
    await executor.cleanup(workDir);
  });

  it('captures stderr', async () => {
    const workDir = await executor.createWorkDir('test-stderr-');
    const result = await executor.exec(workDir, ['node', '--input-type=commonjs', '-e', "console.error('warning')"]);

    expect(result.stderr).toContain('warning');
    await executor.cleanup(workDir);
  });

  it('captures non-zero exit code', async () => {
    const workDir = await executor.createWorkDir('test-exit-');
    const result = await executor.exec(workDir, ['node', '--input-type=commonjs', '-e', 'process.exit(42)']);

    expect(result.exitCode).toBe(42);
    await executor.cleanup(workDir);
  });

  it('returns error result for invalid command', async () => {
    const workDir = await executor.createWorkDir('test-invalid-');
    const result = await executor.exec(workDir, ['nonexistent_command_xyz']);

    expect(result.exitCode).not.toBe(0);
    await executor.cleanup(workDir);
  });

  describe('stdin delivery (multi-line prompt safety)', () => {
    // Single-line node script that echoes stdin verbatim. Kept on one line so
    // the script itself never contains an embedded \n that cmd.exe could trip
    // over — the multi-line content under test arrives via stdin, not argv.
    const ECHO_STDIN_SCRIPT =
      "let b='';process.stdin.setEncoding('utf-8');process.stdin.on('data',d=>{b+=d});process.stdin.on('end',()=>{process.stdout.write(b)})";

    it('delivers a multi-line stdin payload to a node child intact', async () => {
      const workDir = await executor.createWorkDir('test-stdin-multiline-');
      const multiLinePayload = [
        'line one of jumbo context wrapper',
        'line two — scenario continuation',
        'line three with embedded "quotes" and \\backslashes',
        '',
        'line five after a blank',
      ].join('\n');

      const result = await executor.exec(
        workDir,
        ['node', '-e', ECHO_STDIN_SCRIPT],
        { stdin: multiLinePayload },
      );

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe(multiLinePayload);
      await executor.cleanup(workDir);
    });

    it('omits stdin entirely when the option is not provided (stdin closes immediately)', async () => {
      const workDir = await executor.createWorkDir('test-stdin-none-');
      const result = await executor.exec(workDir, ['node', '-e', ECHO_STDIN_SCRIPT]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe('');
      await executor.cleanup(workDir);
    });

    // Windows is where this bug actually manifests: cmd.exe /d /s /c truncates
    // joined argv at the first newline. This test documents that the new
    // delivery path bypasses cmd.exe's tokenizer by going through stdin.
    const describeWindows = process.platform === 'win32' ? describe : describe.skip;
    describeWindows('Windows cmd.exe newline handling', () => {
      it('preserves Jumbo-context-shaped multi-line prompt across cmd.exe via stdin', async () => {
        const workDir = await executor.createWorkDir('test-stdin-win-');
        const jumboShapedPrompt = [
          '## Jumbo session context',
          '',
          'Project: Jumbo Evals',
          'Active goal: eaf11d9e — repair LocalExecutor command-delivery path',
          '',
          '## Scenario',
          '',
          'Build a hello-world TypeScript module that exports `greet(name)`.',
        ].join('\n');

        const result = await executor.exec(
          workDir,
          ['node', '-e', ECHO_STDIN_SCRIPT],
          { stdin: jumboShapedPrompt },
        );

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toBe(jumboShapedPrompt);
        // Specifically the lines that used to be silently dropped:
        expect(result.stdout).toContain('Active goal: eaf11d9e');
        expect(result.stdout).toContain('Build a hello-world TypeScript module');
        await executor.cleanup(workDir);
      });
    });
  });

  it('cleanup removes the directory', async () => {
    const workDir = await executor.createWorkDir('test-cleanup-');
    expect(existsSync(workDir)).toBe(true);

    await executor.cleanup(workDir);
    expect(existsSync(workDir)).toBe(false);
  });

  it('cleanup is safe to call on non-existent directory', async () => {
    await expect(executor.cleanup('/tmp/nonexistent-dir-xyz')).resolves.not.toThrow();
  });

  describe('captureWorkspaceSnapshot', () => {
    it('includes normal files in snapshot', async () => {
      const workDir = await executor.createWorkDir('test-snap-');
      await writeFile(join(workDir, 'main.ts'), 'export const x = 1;');
      const snapshot = await executor.captureWorkspaceSnapshot(workDir);
      expect(snapshot.files.some((f) => f.path === 'main.ts')).toBe(true);
      await executor.cleanup(workDir);
    });

    it('excludes .env files', async () => {
      const workDir = await executor.createWorkDir('test-snap-env-');
      await writeFile(join(workDir, '.env'), 'API_KEY=secret123');
      await writeFile(join(workDir, '.env.local'), 'DB_PASSWORD=hunter2');
      await writeFile(join(workDir, '.env.production'), 'TOKEN=abc');
      await writeFile(join(workDir, 'safe.txt'), 'safe content');
      const snapshot = await executor.captureWorkspaceSnapshot(workDir);
      const paths = snapshot.files.map((f) => f.path);
      expect(paths).not.toContain('.env');
      expect(paths).not.toContain('.env.local');
      expect(paths).not.toContain('.env.production');
      expect(paths).toContain('safe.txt');
      await executor.cleanup(workDir);
    });

    it('excludes cert and key files', async () => {
      const workDir = await executor.createWorkDir('test-snap-keys-');
      await writeFile(join(workDir, 'server.key'), 'PRIVATE KEY CONTENT');
      await writeFile(join(workDir, 'server.pem'), 'CERT CONTENT');
      await writeFile(join(workDir, 'id_rsa'), 'RSA KEY');
      await writeFile(join(workDir, 'config.json'), '{"port":3000}');
      const snapshot = await executor.captureWorkspaceSnapshot(workDir);
      const paths = snapshot.files.map((f) => f.path);
      expect(paths).not.toContain('server.key');
      expect(paths).not.toContain('server.pem');
      expect(paths).not.toContain('id_rsa');
      expect(paths).toContain('config.json');
      await executor.cleanup(workDir);
    });

    it('excludes secret-named credential files', async () => {
      const workDir = await executor.createWorkDir('test-snap-creds-');
      await writeFile(join(workDir, 'credentials.json'), '{"token":"abc"}');
      await writeFile(join(workDir, 'secrets.yaml'), 'key: value');
      await writeFile(join(workDir, 'api_keys.txt'), 'key=123');
      await writeFile(join(workDir, 'readme.md'), '# Project');
      const snapshot = await executor.captureWorkspaceSnapshot(workDir);
      const paths = snapshot.files.map((f) => f.path);
      expect(paths).not.toContain('credentials.json');
      expect(paths).not.toContain('secrets.yaml');
      expect(paths).not.toContain('api_keys.txt');
      expect(paths).toContain('readme.md');
      await executor.cleanup(workDir);
    });

    it('excludes secret-prone files in subdirectories', async () => {
      const workDir = await executor.createWorkDir('test-snap-sub-');
      await mkdir(join(workDir, 'config'));
      await writeFile(join(workDir, 'config', '.env'), 'SECRET=x');
      await writeFile(join(workDir, 'config', 'app.json'), '{}');
      const snapshot = await executor.captureWorkspaceSnapshot(workDir);
      const paths = snapshot.files.map((f) => f.path);
      expect(paths).not.toContain('config/.env');
      expect(paths).toContain('config/app.json');
      await executor.cleanup(workDir);
    });

    it('summarizes .jumbo/events into jumboEvents without capturing event content as files', async () => {
      const workDir = await executor.createWorkDir('test-snap-events-');
      const eventsDir = join(workDir, '.jumbo', 'events');
      await mkdir(join(eventsDir, 'project'), { recursive: true });
      await mkdir(join(eventsDir, 'agg-1'), { recursive: true });
      await writeFile(join(eventsDir, 'project', '000001.ProjectInitializedEvent.json'), '{"big":"content"}');
      await writeFile(join(eventsDir, 'agg-1', '000001.DecisionAddedEvent.json'), '{"big":"content"}');
      await writeFile(join(workDir, 'main.ts'), 'export const x = 1;');

      const snapshot = await executor.captureWorkspaceSnapshot(workDir);

      // user-authored files still captured
      expect(snapshot.files.some((f) => f.path === 'main.ts')).toBe(true);
      // .jumbo content NOT captured as workspace files
      expect(snapshot.files.some((f) => f.path.startsWith('.jumbo/'))).toBe(false);
      // event log summarized
      expect(snapshot.jumboEvents).toBeDefined();
      expect(snapshot.jumboEvents!.eventCount).toBe(2);
      expect(snapshot.jumboEvents!.aggregateCount).toBe(2);
      expect(snapshot.jumboEvents!.countsByType).toEqual({
        ProjectInitializedEvent: 1,
        DecisionAddedEvent: 1,
      });
      await executor.cleanup(workDir);
    });

    it('omits jumboEvents when there is no .jumbo directory (baseline arm)', async () => {
      const workDir = await executor.createWorkDir('test-snap-no-jumbo-');
      await writeFile(join(workDir, 'main.ts'), 'export const x = 1;');
      const snapshot = await executor.captureWorkspaceSnapshot(workDir);
      expect(snapshot.jumboEvents).toBeUndefined();
      await executor.cleanup(workDir);
    });
  });

  describe('diffWorkspaceSnapshots', () => {
    const snap = (...files: ReadonlyArray<readonly [string, string]>) => ({
      capturedAt: '2026-05-01T00:00:00.000Z',
      files: files.map(([path, content]) => ({ path, content })),
    });

    it('returns empty when snapshots match', () => {
      const before = snap(['a.ts', 'x'], ['b.ts', 'y']);
      const after = snap(['a.ts', 'x'], ['b.ts', 'y']);
      expect(LocalExecutor.diffWorkspaceSnapshots(before, after)).toEqual([]);
    });

    it('reports added files', () => {
      const before = snap(['a.ts', 'x']);
      const after = snap(['a.ts', 'x'], ['new.ts', 'hello']);
      expect(LocalExecutor.diffWorkspaceSnapshots(before, after)).toEqual(['new.ts']);
    });

    it('reports files with changed content', () => {
      const before = snap(['a.ts', 'old']);
      const after = snap(['a.ts', 'new']);
      expect(LocalExecutor.diffWorkspaceSnapshots(before, after)).toEqual(['a.ts']);
    });

    it('treats missing before-snapshot as all files added', () => {
      const after = snap(['b.ts', 'y'], ['a.ts', 'x']);
      expect(LocalExecutor.diffWorkspaceSnapshots(undefined, after)).toEqual(['a.ts', 'b.ts']);
    });

    it('ignores files removed in after', () => {
      const before = snap(['a.ts', 'x'], ['b.ts', 'y']);
      const after = snap(['a.ts', 'x']);
      expect(LocalExecutor.diffWorkspaceSnapshots(before, after)).toEqual([]);
    });

    it('returns sorted paths', () => {
      const before = snap();
      const after = snap(['z.ts', '1'], ['a.ts', '1'], ['m.ts', '1']);
      expect(LocalExecutor.diffWorkspaceSnapshots(before, after)).toEqual(['a.ts', 'm.ts', 'z.ts']);
    });
  });
});
