import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { GeminiCliAdapter } from '../../src/harness/gemini-cli-adapter.js';

describe('GeminiCliAdapter', () => {
  const adapter = new GeminiCliAdapter();

  it('has the correct name', () => {
    expect(adapter.name).toBe('gemini-cli');
  });

  it('builds a gemini command without a positional prompt (prompt goes via stdin)', () => {
    const command = adapter.buildCommand();
    expect(command).toEqual(['gemini', '--json']);
  });

  it('parses JSON output with text field', () => {
    const result = adapter.parseOutput({
      stdout: JSON.stringify({
        text: 'Created index.ts with hello world',
        files_modified: ['index.ts', 'package.json'],
      }),
      stderr: '',
      exitCode: 0,
    });

    expect(result.agentOutput).toBe('Created index.ts with hello world');
    expect(result.filesModified).toEqual(['index.ts', 'package.json']);
  });

  it('handles non-JSON output gracefully', () => {
    const result = adapter.parseOutput({
      stdout: 'Plain text response',
      stderr: '',
      exitCode: 0,
    });

    expect(result.agentOutput).toBe('Plain text response');
    expect(result.filesModified).toEqual([]);
  });

  it('extracts token counts from usage_metadata', () => {
    const result = adapter.parseOutput({
      stdout: JSON.stringify({
        text: 'Done',
        usage_metadata: { prompt_token_count: 1800, candidates_token_count: 900 },
      }),
      stderr: '',
      exitCode: 0,
    });

    expect(result.inputTokens).toBe(1800);
    expect(result.outputTokens).toBe(900);
  });

  it('extracts token counts from top-level fields', () => {
    const result = adapter.parseOutput({
      stdout: JSON.stringify({
        text: 'Done',
        prompt_token_count: 1500,
        candidates_token_count: 700,
      }),
      stderr: '',
      exitCode: 0,
    });

    expect(result.inputTokens).toBe(1500);
    expect(result.outputTokens).toBe(700);
  });

  it('returns undefined tokens for non-JSON output', () => {
    const result = adapter.parseOutput({
      stdout: 'text',
      stderr: '',
      exitCode: 0,
    });

    expect(result.inputTokens).toBeUndefined();
    expect(result.outputTokens).toBeUndefined();
  });

  it('includes stderr in transcript', () => {
    const result = adapter.parseOutput({
      stdout: 'output',
      stderr: 'warning',
      exitCode: 0,
    });

    expect(result.transcript).toContain('output');
    expect(result.transcript).toContain('warning');
    expect(result.transcript).toContain('---stderr---');
  });

  it('does not embed any prompt in argv (prompt is delivered via stdin)', () => {
    const command = adapter.buildCommand();
    expect(command).not.toContain('Build a REST API');
    expect(command).toEqual(['gemini', '--json']);
  });

  describe('seedToolPermissions', () => {
    let workDir: string;

    beforeEach(async () => {
      workDir = await mkdtemp(join(tmpdir(), 'gemini-adapter-seed-'));
    });

    afterEach(async () => {
      await rm(workDir, { recursive: true, force: true });
    });

    it('writes .gemini/settings.json allowlisting run_shell_command(jumbo)', async () => {
      await adapter.seedToolPermissions(workDir);
      const raw = await readFile(join(workDir, '.gemini', 'settings.json'), 'utf-8');
      const settings = JSON.parse(raw);

      expect(settings.tools.allowed).toContain('run_shell_command(jumbo)');
      expect(settings.general.defaultApprovalMode).toBe('auto_edit');
    });

    it('does not set tools.core (which would disable other built-in tools)', async () => {
      await adapter.seedToolPermissions(workDir);
      const settings = JSON.parse(await readFile(join(workDir, '.gemini', 'settings.json'), 'utf-8'));
      expect(settings.tools.core).toBeUndefined();
    });

    it('is idempotent: re-seeding overwrites without error', async () => {
      await adapter.seedToolPermissions(workDir);
      await adapter.seedToolPermissions(workDir);
      const settings = JSON.parse(await readFile(join(workDir, '.gemini', 'settings.json'), 'utf-8'));
      expect(settings.tools.allowed).toContain('run_shell_command(jumbo)');
    });
  });
});
