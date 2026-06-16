import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CodexCliAdapter } from '../../src/harness/codex-cli-adapter.js';

describe('CodexCliAdapter', () => {
  const adapter = new CodexCliAdapter();

  it('has the correct name', () => {
    expect(adapter.name).toBe('codex-cli');
  });

  it('builds a codex command without a positional prompt (prompt goes via stdin)', () => {
    const command = adapter.buildCommand();
    expect(command).toEqual(['codex', '--quiet', '--json']);
  });

  it('parses JSON output with response field', () => {
    const result = adapter.parseOutput({
      stdout: JSON.stringify({
        response: 'Created index.ts with hello world',
        files_modified: ['index.ts', 'package.json'],
      }),
      stderr: '',
      exitCode: 0,
    });

    expect(result.agentOutput).toBe('Created index.ts with hello world');
    expect(result.filesModified).toEqual(['index.ts', 'package.json']);
    expect(result.transcript).toContain('Created index.ts');
  });

  it('handles non-JSON output gracefully', () => {
    const result = adapter.parseOutput({
      stdout: 'Plain text response from codex',
      stderr: '',
      exitCode: 0,
    });

    expect(result.agentOutput).toBe('Plain text response from codex');
    expect(result.filesModified).toEqual([]);
  });

  it('extracts token counts from usage object', () => {
    const result = adapter.parseOutput({
      stdout: JSON.stringify({
        response: 'Done',
        usage: { prompt_tokens: 2000, completion_tokens: 1000 },
      }),
      stderr: '',
      exitCode: 0,
    });

    expect(result.inputTokens).toBe(2000);
    expect(result.outputTokens).toBe(1000);
  });

  it('extracts token counts from top-level fields', () => {
    const result = adapter.parseOutput({
      stdout: JSON.stringify({
        response: 'Done',
        prompt_tokens: 1500,
        completion_tokens: 800,
      }),
      stderr: '',
      exitCode: 0,
    });

    expect(result.inputTokens).toBe(1500);
    expect(result.outputTokens).toBe(800);
  });

  it('returns undefined tokens for non-JSON output', () => {
    const result = adapter.parseOutput({
      stdout: 'plain text',
      stderr: '',
      exitCode: 0,
    });

    expect(result.inputTokens).toBeUndefined();
    expect(result.outputTokens).toBeUndefined();
  });

  it('includes stderr in transcript', () => {
    const result = adapter.parseOutput({
      stdout: 'output',
      stderr: 'some warning',
      exitCode: 0,
    });

    expect(result.transcript).toContain('output');
    expect(result.transcript).toContain('some warning');
    expect(result.transcript).toContain('---stderr---');
  });

  it('does not embed any prompt in argv (identical-prompts invariant via stdin delivery)', () => {
    const command = adapter.buildCommand();
    expect(command).not.toContain('Build a REST API with authentication');
    expect(command).toEqual(['codex', '--quiet', '--json']);
  });

  describe('seedToolPermissions', () => {
    let workDir: string;

    beforeEach(async () => {
      workDir = await mkdtemp(join(tmpdir(), 'codex-adapter-seed-'));
    });

    afterEach(async () => {
      await rm(workDir, { recursive: true, force: true });
    });

    it('writes .codex/config.toml with non-interactive approval and workspace-write sandbox', async () => {
      await adapter.seedToolPermissions(workDir);
      const toml = await readFile(join(workDir, '.codex', 'config.toml'), 'utf-8');
      expect(toml).toContain('approval_policy = "never"');
      expect(toml).toContain('sandbox_mode = "workspace-write"');
    });

    it('is idempotent: re-seeding overwrites without error', async () => {
      await adapter.seedToolPermissions(workDir);
      await adapter.seedToolPermissions(workDir);
      const toml = await readFile(join(workDir, '.codex', 'config.toml'), 'utf-8');
      expect(toml).toContain('approval_policy = "never"');
    });
  });
});
