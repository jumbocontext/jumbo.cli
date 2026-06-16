import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ExecResult } from '../infrastructure/container-manager.js';
import type { HarnessAdapter } from './harness-adapter.js';

/**
 * HarnessAdapter for Google Gemini CLI.
 * Invokes via 'gemini --json' which accepts a prompt
 * and returns JSON output with the response and metadata.
 *
 * Gemini CLI output format (JSON mode):
 * {
 *   "text": "...",
 *   "files_modified": ["..."],
 *   "usage_metadata": { "prompt_token_count": N, "candidates_token_count": N }
 * }
 */
export class GeminiCliAdapter implements HarnessAdapter {
  readonly name = 'gemini-cli';

  buildCommand(): string[] {
    return ['gemini', '--json'];
  }

  /**
   * Seeds .gemini/settings.json with a tools.allowed entry that bypasses
   * confirmation for shell commands beginning with `jumbo`. Gemini's
   * `run_shell_command(<prefix>)` is the per-command-prefix allowlist
   * syntax — equivalent in spirit to Claude Code's `Bash(jumbo:*)`.
   * defaultApprovalMode="auto_edit" is the file-level policy that does
   * not require interactive confirmation for tool invocations covered
   * by tools.allowed. tools.core is intentionally NOT set: doing so
   * would disable every other built-in tool.
   */
  async seedToolPermissions(workDir: string): Promise<void> {
    const settingsDir = join(workDir, '.gemini');
    await mkdir(settingsDir, { recursive: true });
    const settings = {
      general: {
        defaultApprovalMode: 'auto_edit',
      },
      tools: {
        allowed: [
          'run_shell_command(jumbo)',
        ],
      },
    };
    await writeFile(join(settingsDir, 'settings.json'), `${JSON.stringify(settings, null, 2)}\n`, 'utf-8');
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

      if (parsed.text) {
        agentOutput = parsed.text;
      }

      if (Array.isArray(parsed.files_modified)) {
        filesModified.push(...parsed.files_modified);
      }

      // Gemini uses usage_metadata with prompt_token_count / candidates_token_count
      if (parsed.usage_metadata) {
        if (typeof parsed.usage_metadata.prompt_token_count === 'number') {
          inputTokens = parsed.usage_metadata.prompt_token_count;
        }
        if (typeof parsed.usage_metadata.candidates_token_count === 'number') {
          outputTokens = parsed.usage_metadata.candidates_token_count;
        }
      }

      // Also check top-level fields
      if (typeof parsed.prompt_token_count === 'number') {
        inputTokens = parsed.prompt_token_count;
      }
      if (typeof parsed.candidates_token_count === 'number') {
        outputTokens = parsed.candidates_token_count;
      }
    } catch {
      // Non-JSON output — use raw stdout as agent output
    }

    return { agentOutput, filesModified, transcript, inputTokens, outputTokens };
  }
}
