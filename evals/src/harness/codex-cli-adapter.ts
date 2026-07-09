import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ExecResult } from '../infrastructure/container-manager.js';
import type { HarnessAdapter } from './harness-adapter.js';

/**
 * HarnessAdapter for OpenAI Codex CLI.
 * Invokes via 'codex exec --json' and sends the prompt on stdin.
 * Current Codex CLI JSON mode emits newline-delimited event objects.
 *
 * Older fixtures may still use the previous single-object JSON shape:
 * {
 *   "response": "...",
 *   "files_modified": ["..."],
 *   "usage": { "prompt_tokens": N, "completion_tokens": N }
 * }
 */
export class CodexCliAdapter implements HarnessAdapter {
  readonly name = 'codex-cli';

  buildCommand(): string[] {
    return [
      'codex',
      '--ask-for-approval',
      'never',
      '--sandbox',
      'workspace-write',
      'exec',
      '--json',
      '--skip-git-repo-check',
    ];
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
      const single = parseCodexJsonValue(parsed);
      agentOutput = single.agentOutput ?? agentOutput;
      filesModified.push(...single.filesModified);
      inputTokens = single.inputTokens;
      outputTokens = single.outputTokens;
    } catch {
      const jsonl = parseCodexJsonLines(result.stdout);
      if (jsonl) {
        agentOutput = jsonl.agentOutput ?? agentOutput;
        filesModified.push(...jsonl.filesModified);
        inputTokens = jsonl.inputTokens;
        outputTokens = jsonl.outputTokens;
      }
    }

    return { agentOutput, filesModified, transcript, inputTokens, outputTokens };
  }
}

interface ParsedCodexOutput {
  readonly agentOutput?: string;
  readonly filesModified: readonly string[];
  readonly inputTokens?: number;
  readonly outputTokens?: number;
}

function parseCodexJsonLines(stdout: string): ParsedCodexOutput | undefined {
  const values = stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map(parseJsonLine)
    .filter((value): value is unknown => value !== undefined);

  if (values.length === 0) return undefined;

  return mergeCodexValues(values);
}

function parseJsonLine(line: string): unknown | undefined {
  try {
    return JSON.parse(line);
  } catch {
    return undefined;
  }
}

function parseCodexJsonValue(value: unknown): ParsedCodexOutput {
  if (Array.isArray(value)) {
    return mergeCodexValues(value);
  }
  return mergeCodexValues([value]);
}

function mergeCodexValues(values: readonly unknown[]): ParsedCodexOutput {
  const filesModified: string[] = [];
  let agentOutput: string | undefined;
  let inputTokens: number | undefined;
  let outputTokens: number | undefined;

  for (const value of values) {
    const files = extractStringArray(value, 'files_modified');
    if (files) filesModified.push(...files);

    const tokens = extractTokenUsage(value);
    inputTokens = tokens.inputTokens ?? inputTokens;
    outputTokens = tokens.outputTokens ?? outputTokens;

    const text = extractAgentText(value);
    if (text !== undefined && text.length > 0) {
      agentOutput = text;
    }
  }

  return {
    agentOutput,
    filesModified: [...new Set(filesModified)],
    inputTokens,
    outputTokens,
  };
}

function extractAgentText(value: unknown): string | undefined {
  if (!isRecord(value)) return undefined;

  const direct = firstString(value, ['response', 'result', 'agent_output', 'final_message']);
  if (direct !== undefined) return direct;

  const type = typeof value.type === 'string' ? value.type : '';
  if (type.includes('message') || type.includes('completed')) {
    const eventText = firstString(value, ['message', 'text']);
    if (eventText !== undefined) return eventText;

    const contentText = extractContentText(value.content);
    if (contentText !== undefined) return contentText;
  }

  if (isRecord(value.item)) {
    const role = typeof value.item.role === 'string' ? value.item.role : '';
    const itemType = typeof value.item.type === 'string' ? value.item.type : '';
    if (role === 'assistant' || itemType.includes('message')) {
      const itemText = firstString(value.item, ['message', 'text']);
      if (itemText !== undefined) return itemText;
      return extractContentText(value.item.content);
    }
  }

  return undefined;
}

function extractContentText(content: unknown): string | undefined {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return undefined;

  const parts = content
    .map((part) => {
      if (typeof part === 'string') return part;
      if (!isRecord(part)) return undefined;
      return firstString(part, ['text', 'output_text']);
    })
    .filter((part): part is string => part !== undefined && part.length > 0);

  return parts.length > 0 ? parts.join('') : undefined;
}

function extractTokenUsage(value: unknown): { inputTokens?: number; outputTokens?: number } {
  if (!isRecord(value)) return {};

  const usage = isRecord(value.usage) ? value.usage : value;
  return {
    inputTokens: firstNumber(usage, ['prompt_tokens', 'input_tokens']),
    outputTokens: firstNumber(usage, ['completion_tokens', 'output_tokens']),
  };
}

function extractStringArray(value: unknown, key: string): string[] | undefined {
  if (!isRecord(value)) return undefined;
  const candidate = value[key];
  if (!Array.isArray(candidate)) return undefined;
  return candidate.filter((item): item is string => typeof item === 'string');
}

function firstString(record: Record<string, unknown>, keys: readonly string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string') return value;
  }
  return undefined;
}

function firstNumber(record: Record<string, unknown>, keys: readonly string[]): number | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number') return value;
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
