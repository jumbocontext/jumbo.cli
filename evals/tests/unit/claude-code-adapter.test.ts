import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ClaudeCodeAdapter } from '../../src/harness/claude-code-adapter.js';

describe('ClaudeCodeAdapter', () => {
  const adapter = new ClaudeCodeAdapter();

  it('has the correct name', () => {
    expect(adapter.name).toBe('claude-code');
  });

  it('builds a claude -p command without a positional prompt (prompt goes via stdin)', () => {
    const command = adapter.buildCommand();
    expect(command).toEqual(['claude', '-p', '--output-format', 'json']);
  });

  it('parses JSON output with result field', () => {
    const result = adapter.parseOutput({
      stdout: JSON.stringify({
        result: 'Created index.ts with hello world',
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
      stdout: 'Plain text response from claude',
      stderr: '',
      exitCode: 0,
    });

    expect(result.agentOutput).toBe('Plain text response from claude');
    expect(result.filesModified).toEqual([]);
  });

  it('extracts token counts from top-level fields', () => {
    const result = adapter.parseOutput({
      stdout: JSON.stringify({
        result: 'Done',
        input_tokens: 1500,
        output_tokens: 800,
      }),
      stderr: '',
      exitCode: 0,
    });

    expect(result.inputTokens).toBe(1500);
    expect(result.outputTokens).toBe(800);
  });

  it('extracts token counts from nested usage object', () => {
    const result = adapter.parseOutput({
      stdout: JSON.stringify({
        result: 'Done',
        usage: { input_tokens: 2000, output_tokens: 1000 },
      }),
      stderr: '',
      exitCode: 0,
    });

    expect(result.inputTokens).toBe(2000);
    expect(result.outputTokens).toBe(1000);
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

  describe('seedToolPermissions', () => {
    let workDir: string;

    beforeEach(async () => {
      workDir = await mkdtemp(join(tmpdir(), 'claude-adapter-seed-'));
    });

    afterEach(async () => {
      await rm(workDir, { recursive: true, force: true });
    });

    it('writes .claude/settings.json with a Bash(jumbo:*) allowlist', async () => {
      await adapter.seedToolPermissions(workDir);
      const raw = await readFile(join(workDir, '.claude', 'settings.json'), 'utf-8');
      const settings = JSON.parse(raw);

      expect(settings.permissions.allow).toEqual(expect.arrayContaining([
        'Bash(jumbo)',
        'Bash(jumbo:*)',
      ]));
    });

    it('is idempotent: re-seeding overwrites without error', async () => {
      await adapter.seedToolPermissions(workDir);
      await adapter.seedToolPermissions(workDir);
      const raw = await readFile(join(workDir, '.claude', 'settings.json'), 'utf-8');
      expect(JSON.parse(raw).permissions.allow).toContain('Bash(jumbo:*)');
    });
  });
});
