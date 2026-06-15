import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ExecResult } from '../infrastructure/container-manager.js';
import type { HarnessAdapter } from './harness-adapter.js';

/**
 * HarnessAdapter for Claude Code CLI.
 * Invokes via 'claude -p' (print mode) which reads the prompt from
 * stdin when no positional prompt argument is provided. The eval
 * harness pipes the effective prompt through LocalExecutor.exec's
 * stdin option so multi-line content survives Windows cmd.exe.
 */
export class ClaudeCodeAdapter implements HarnessAdapter {
  readonly name = 'claude-code';

  buildCommand(): string[] {
    return ['claude', '-p', '--output-format', 'json'];
  }

  /**
   * Seeds .claude/settings.json with a permissions.allow allowlist that
   * permits Bash invocations starting with `jumbo` to run without
   * interactive approval. `Bash(jumbo:*)` is Claude Code's prefix-match
   * syntax; the bare `Bash(jumbo)` entry covers the no-arg invocation.
   */
  async seedToolPermissions(workDir: string): Promise<void> {
    const settingsDir = join(workDir, '.claude');
    await mkdir(settingsDir, { recursive: true });
    const settings = {
      permissions: {
        allow: [
          'Bash(jumbo)',
          'Bash(jumbo:*)',
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
      if (parsed.result) {
        agentOutput = parsed.result;
      }
      if (Array.isArray(parsed.files_modified)) {
        filesModified.push(...parsed.files_modified);
      }
      // Claude Code CLI JSON output includes usage stats
      if (typeof parsed.input_tokens === 'number') {
        inputTokens = parsed.input_tokens;
      }
      if (typeof parsed.output_tokens === 'number') {
        outputTokens = parsed.output_tokens;
      }
      // Also check nested usage object
      if (parsed.usage) {
        if (typeof parsed.usage.input_tokens === 'number') {
          inputTokens = parsed.usage.input_tokens;
        }
        if (typeof parsed.usage.output_tokens === 'number') {
          outputTokens = parsed.usage.output_tokens;
        }
      }
    } catch {
      // Non-JSON output — use raw stdout as agent output
    }

    return { agentOutput, filesModified, transcript, inputTokens, outputTokens };
  }
}
