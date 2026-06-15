import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ClaudeCodeAdapter } from '../../src/harness/claude-code-adapter.js';
import { CodexCliAdapter } from '../../src/harness/codex-cli-adapter.js';
import { GeminiCliAdapter } from '../../src/harness/gemini-cli-adapter.js';
import { LocalExecutor } from '../../src/infrastructure/local-executor.js';
import type { HarnessAdapter } from '../../src/harness/harness-adapter.js';

/**
 * Goal 26e636a6 success criterion: each adapter passes a regression test
 * confirming `jumbo --version` succeeds when invoked via the adapter's
 * tool path inside a real session — i.e., a real workdir seeded with the
 * adapter's permission/config artifact, with the same LocalExecutor and
 * env the adapter will use during sessions. Requires the `jumbo` binary
 * on PATH; integration scope only.
 */
describe('adapter jumbo reachability (integration)', () => {
  const adapters: ReadonlyArray<readonly [string, HarnessAdapter]> = [
    ['claude-code', new ClaudeCodeAdapter()],
    ['codex-cli', new CodexCliAdapter()],
    ['gemini-cli', new GeminiCliAdapter()],
  ];

  let workDir: string;
  const executor = new LocalExecutor();

  beforeEach(async () => {
    workDir = await mkdtemp(join(tmpdir(), 'jumbo-reachable-'));
  });

  afterEach(async () => {
    await rm(workDir, { recursive: true, force: true });
  });

  for (const [name, adapter] of adapters) {
    it(`${name}: jumbo --version succeeds in a real seeded workdir`, async () => {
      await adapter.seedToolPermissions(workDir);

      const result = await executor.exec(workDir, ['jumbo', '--version']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout.toLowerCase()).toMatch(/jumbo|\d+\.\d+/);
    });
  }
});
