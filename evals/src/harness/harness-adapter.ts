import type { ExecResult } from '../infrastructure/container-manager.js';

/**
 * Interface for agent harness adapters.
 * Each adapter knows how to invoke its CLI, parse the output, and
 * return argv that does NOT include the prompt — the prompt is delivered
 * to the child process via stdin (see LocalExecutor.exec). This avoids
 * Windows cmd.exe truncating multi-line argv at the first newline.
 */
export interface HarnessAdapter {
  readonly name: string;

  buildCommand(): string[];

  parseOutput(result: ExecResult): {
    agentOutput: string;
    filesModified: string[];
    transcript: string;
    inputTokens?: number;
    outputTokens?: number;
  };

  /**
   * Writes the per-adapter permission/config artifact into a workdir so
   * the agent CLI can invoke the `jumbo` binary during a session without
   * an interactive approval prompt. Each adapter owns the knowledge of
   * its native config path and shape (e.g., Claude Code's
   * .claude/settings.json, Gemini's .gemini/settings.json,
   * Codex's .codex/config.toml). Idempotent: safe to call on a workdir
   * that already contains the artifact.
   *
   * PATH inheritance is the runner's responsibility (LocalExecutor
   * forwards process.env). This method only configures the CLI's
   * permission layer.
   */
  seedToolPermissions(workDir: string): Promise<void>;
}
