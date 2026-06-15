#!/usr/bin/env node
/**
 * Contract smoke test between the evals and the jumbo CLI.
 *
 * Drives the real `jumbo` on PATH (point it at source via with-jumbo-source.mjs)
 * through the exact surface the evals depend on, and asserts the contract holds:
 *   - `jumbo init --non-interactive ... --yolo` succeeds          (ab-runner setup)
 *   - `jumbo <kind> add ...` succeeds for decision/component/goal  (memory seeding + agent lifecycle)
 *   - `jumbo decisions list --format json` returns parseable JSON  (memory snapshot)
 *   - `.jumbo/events/<aggregateId>/<seq>.<EventType>.json` layout holds, with the
 *     expected event types present                                 (Outcome 2 event summary)
 *
 * If a jumbo primitive refactor breaks any of these, this exits non-zero — so
 * the jumbo PR gate catches it instead of the evals silently rotting.
 *
 * No coding-agent harness is involved, so this runs headless in CI.
 */
import { mkdtempSync, rmSync, existsSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const isWin = process.platform === 'win32';
const failures = [];
function check(cond, message) {
  if (cond) {
    console.log(`  ✓ ${message}`);
  } else {
    console.error(`  ✗ ${message}`);
    failures.push(message);
  }
}

// On Windows, `jumbo` resolves to a `.cmd` shim that requires shell:true; but
// shell:true does not quote array args, so values with spaces get split. Quote
// each token ourselves (mirrors LocalExecutor's Windows handling). On POSIX we
// pass the args array directly with shell:false, which needs no quoting.
function winQuote(arg) {
  return /[\s"]/.test(arg) ? `"${arg.replace(/"/g, '\\"')}"` : arg;
}
function jumbo(args, cwd) {
  const r = isWin
    ? spawnSync(['jumbo', ...args].map(winQuote).join(' '), { cwd, encoding: 'utf8', shell: true })
    : spawnSync('jumbo', args, { cwd, encoding: 'utf8', shell: false });
  return { code: r.status ?? 1, stdout: r.stdout ?? '', stderr: r.stderr ?? '', error: r.error };
}

function listEventFiles(workDir) {
  const eventsDir = join(workDir, '.jumbo', 'events');
  const out = [];
  const walk = (dir, rel) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      const childRel = rel ? `${rel}/${name}` : name;
      if (statSync(full).isDirectory()) walk(full, childRel);
      else out.push(childRel);
    }
  };
  if (existsSync(eventsDir)) walk(eventsDir, '');
  return out;
}

const workDir = mkdtempSync(join(tmpdir(), 'jumbo-contract-'));
console.log(`[jumbo-contract-smoke] workDir: ${workDir}`);

try {
  // Confirm we are exercising a real jumbo binary at all.
  const version = jumbo(['--version'], workDir);
  check(version.code === 0, `jumbo --version succeeds (${version.stdout.trim() || version.stderr.trim()})`);

  const init = jumbo(
    ['init', '--purpose', 'contract smoke', '--non-interactive', '--name', 'contract-smoke', '--yolo'],
    workDir,
  );
  check(init.code === 0, 'jumbo init --non-interactive --yolo succeeds');
  check(existsSync(join(workDir, '.jumbo', 'events')), '.jumbo/events/ created by init');

  const decision = jumbo(['decision', 'add', '--title', 'Use event sourcing', '--context', 'smoke'], workDir);
  check(decision.code === 0, 'jumbo decision add succeeds');

  const component = jumbo(
    ['component', 'add', '--name', 'EventStore', '--type', 'lib', '--description', 'd', '--responsibility', 'r', '--path', 'src/x.ts'],
    workDir,
  );
  check(component.code === 0, 'jumbo component add succeeds');

  const goal = jumbo(
    ['goal', 'add', '--title', 'Smoke goal', '--objective', 'verify contract', '--criteria', 'compiles', 'tests pass'],
    workDir,
  );
  check(goal.code === 0, 'jumbo goal add succeeds');

  const decisionsList = jumbo(['decisions', 'list', '--format', 'json'], workDir);
  check(decisionsList.code === 0, 'jumbo decisions list --format json succeeds');
  let parsed = null;
  try {
    parsed = JSON.parse(decisionsList.stdout);
  } catch {
    /* parsed stays null */
  }
  check(parsed !== null, 'decisions list --format json emits parseable JSON');

  // Event-store layout the Outcome 2 summarizer depends on.
  const eventFiles = listEventFiles(workDir);
  check(eventFiles.length > 0, `events written under .jumbo/events/ (${eventFiles.length} files)`);
  const namingOk = eventFiles.every((p) => /^[^/]+\/\d+\..+\.json$/.test(p));
  check(namingOk, 'every event file matches <aggregateId>/<seq>.<EventType>.json');
  const types = new Set(eventFiles.map((p) => p.split('/').pop().replace(/^\d+\./, '').replace(/\.json$/, '')));
  check(types.has('DecisionAddedEvent'), 'DecisionAddedEvent present in event log');
  check(types.has('ComponentAddedEvent'), 'ComponentAddedEvent present in event log');
} finally {
  try {
    rmSync(workDir, { recursive: true, force: true });
  } catch {
    /* best-effort cleanup */
  }
}

if (failures.length > 0) {
  console.error(`\n[jumbo-contract-smoke] FAILED (${failures.length} contract violation(s)):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('\n[jumbo-contract-smoke] OK — evals/jumbo CLI contract holds.');
