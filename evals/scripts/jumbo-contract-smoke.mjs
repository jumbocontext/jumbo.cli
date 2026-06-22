#!/usr/bin/env node
/**
 * Contract smoke test between the evals and the jumbo CLI.
 *
 * Drives the real `jumbo` on PATH (point it at source via with-jumbo-source.mjs)
 * through the exact surface the evals depend on, and asserts the contract holds:
 *   - `jumbo init --non-interactive ... --yolo` succeeds          (ab-runner setup)
 *   - `jumbo <kind> add ...` succeeds for every memory kind         (memory seeding + agent lifecycle)
 *   - `jumbo decisions list --format json` returns parseable JSON  (memory snapshot)
 *   - `.jumbo/events/<aggregateId>/<seq>.<EventType>.json` layout holds, and every
 *     entry in the scorer's addedEventTypeByKind map is actually emitted by jumbo
 *     (jumbo-event-capture scorer contract)                         (Outcome 2/4)
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
// The production kind -> Added-event-type map, imported from the built evals so
// this smoke validates the *actual* scorer contract (not a duplicated copy)
// against real jumbo. Requires `npm run build` first (the smoke:jumbo script
// does this); a missing dist means the evals were not built.
import { addedEventTypeByKind } from '../dist/scoring/jumbo-event-capture-scorer.js';

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

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;
function firstUuid(text) {
  return (text.match(UUID_RE) || [])[0];
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

  // Register one of every remaining memory kind so the event log exercises the
  // whole addedEventTypeByKind map. relation needs two existing entity ids.
  const invariant = jumbo(['invariant', 'add', '--title', 'Append only', '--description', 'log is immutable'], workDir);
  check(invariant.code === 0, 'jumbo invariant add succeeds');

  const guideline = jumbo(
    ['guideline', 'add', '--category', 'testing', '--title', 'Coverage', '--description', 'cover new code', '--rationale', 'quality'],
    workDir,
  );
  check(guideline.code === 0, 'jumbo guideline add succeeds');

  const dependency = jumbo(
    ['dependency', 'add', '--name', 'Commander', '--ecosystem', 'npm', '--package-name', 'commander'],
    workDir,
  );
  check(dependency.code === 0, 'jumbo dependency add succeeds');

  const decisionId = firstUuid(decision.stdout);
  const componentId = firstUuid(component.stdout);
  const relation = decisionId && componentId
    ? jumbo(
        ['relation', 'add', '--from-type', 'component', '--from-id', componentId, '--to-type', 'decision', '--to-id', decisionId, '--type', 'involves', '--description', 'EventStore realizes the decision'],
        workDir,
      )
    : { code: 1, stdout: '', stderr: 'could not parse decision/component ids' };
  check(relation.code === 0, 'jumbo relation add succeeds');

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
  // Validate the scorer's production map against what real jumbo actually emits.
  // If a jumbo refactor renames an event type, the corresponding literal in
  // addedEventTypeByKind no longer matches and this fails — instead of the
  // scorer silently under-counting captures.
  for (const [kind, eventType] of Object.entries(addedEventTypeByKind)) {
    check(types.has(eventType), `event log contains ${eventType} for kind '${kind}' (validates addedEventTypeByKind)`);
  }
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
