import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ExecResult } from '../infrastructure/container-manager.js';
import type { HarnessAdapter } from './harness-adapter.js';

/**
 * HarnessAdapter for OpenAI Codex CLI.
 * Invokes via 'codex --quiet --json' which accepts a prompt
 * and returns JSON output with the response and metadata.
 *
 * Codex CLI output format (JSON mode):
 * {
 *   "response": "...",
 *   "files_modified": ["..."],
 *   "usage": { "prompt_tokens": N, "completion_tokens": N }
 * }
 */
export class CodexCliAdapter implements HarnessAdapter {
  readonly name = 'codex-cli';

  buildCommand(): string[] {
    return ['codex', '--quiet', '--json'];
  }

  /**
   * Seeds .codex/config.toml so Codex runs shell commands without
   * interactive approval (the closest Codex analog to Claude Code's
   * `Bash(jumbo:*)` allowlist — Codex OSS config has no per-command
   * allowlist, so the entire shell tool is unblocked at the policy
   * level). approval_policy="never" suppresses prompts; sandbox_mode
   * ="workspace-write" allows writes inside the workdir which is the
   * eval scope.
   */
  async seedToolPermissions(workDir: string): Promise<void> {
    const configDir = join(workDir, '.codex');
    await mkdir(configDir, { recursive: true });
    const toml = [
      'approval_policy = "never"',
      'sandbox_mode = "workspace-write"',
      '',
    ].join('\n');
    await writeFile(join(configDir, 'config.toml'), toml, 'utf-8');
  }

  parseOutput(result: ExecResult): {
    agentOutput: string;
    filesModified: string[];
    transcript: string;
    inputTokens?: number;
    outputTokens?: number;
  } {
    const transcript = [result.stdout, result.stderr].filter(Boolean).join('\n---stderr---\n');

    let agentOutput = result.stdout;
    const filesModified: string[] = [];
    let inputTokens: number | undefined;
    let outputTokens: number | undefined;

    try {
      const parsed = JSON.parse(result.stdout);

      if (parsed.response) {
        agentOutput = parsed.response;
      }

      if (Array.isArray(parsed.files_modified)) {
        filesModified.push(...parsed.files_modified);
      }

      // Codex CLI uses prompt_tokens / completion_tokens in usage object
      if (parsed.usage) {
        if (typeof parsed.usage.prompt_tokens === 'number') {
          inputTokens = parsed.usage.prompt_tokens;
        }
        if (typeof parsed.usage.completion_tokens === 'number') {
          outputTokens = parsed.usage.completion_tokens;
        }
      }

      // Also check top-level token fields
      if (typeof parsed.prompt_tokens === 'number') {
        inputTokens = parsed.prompt_tokens;
      }
      if (typeof parsed.completion_tokens === 'number') {
        outputTokens = parsed.completion_tokens;
      }
    } catch {
      // Non-JSON output — use raw stdout as agent output
    }

    return { agentOutput, filesModified, transcript, inputTokens, outputTokens };
  }
}
