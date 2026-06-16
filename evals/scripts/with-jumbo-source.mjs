#!/usr/bin/env node
/**
 * Runs a command with `jumbo` on PATH resolved to the *sibling jumbo source
 * build* (../dist/cli.js) instead of any globally-installed jumbo binary.
 *
 * This only works inside the jumbo.cli monorepo, where `evals/..` is the jumbo
 * root — which is exactly the point: it ties the evals to the jumbo source they
 * are meant to guard, eliminating the version skew between a globally-installed
 * jumbo and the source under test.
 *
 * Usage: node scripts/with-jumbo-source.mjs <command> [args...]
 *   e.g. node scripts/with-jumbo-source.mjs npm run test:integration
 *
 * The eval harness (LocalExecutor) spawns `jumbo` directly on POSIX (shell:false)
 * and via cmd.exe on Windows (shell:true), so we install both a `jumbo` shell
 * shim and a `jumbo.cmd` shim into a temp dir prepended to PATH.
 */
import { mkdtempSync, writeFileSync, chmodSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const evalsDir = resolve(here, '..');
const jumboRoot = resolve(evalsDir, '..');
const jumboEntry = join(jumboRoot, 'dist', 'cli.js');

if (!existsSync(jumboEntry)) {
  console.error(
    `[with-jumbo-source] jumbo build not found at ${jumboEntry}\n` +
      `Build it first:\n` +
      `  npm --prefix "${jumboRoot}" ci\n` +
      `  npm --prefix "${jumboRoot}" run build`,
  );
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('[with-jumbo-source] usage: node scripts/with-jumbo-source.mjs <command> [args...]');
  process.exit(2);
}

const isWin = process.platform === 'win32';
const binDir = mkdtempSync(join(tmpdir(), 'jumbo-src-bin-'));

// POSIX shim (used when LocalExecutor spawns with shell:false)
writeFileSync(join(binDir, 'jumbo'), `#!/bin/sh\nexec node "${jumboEntry}" "$@"\n`);
chmodSync(join(binDir, 'jumbo'), 0o755);

// Windows shim (used when LocalExecutor spawns with shell:true via cmd.exe)
writeFileSync(join(binDir, 'jumbo.cmd'), `@echo off\r\nnode "${jumboEntry}" %*\r\n`);

const env = { ...process.env, PATH: binDir + (isWin ? ';' : ':') + process.env.PATH };
const result = spawnSync(args[0], args.slice(1), { stdio: 'inherit', env, shell: isWin });

if (result.error) {
  console.error(`[with-jumbo-source] failed to run: ${args.join(' ')}`);
  console.error(result.error);
  process.exit(1);
}
process.exit(result.status ?? 1);
