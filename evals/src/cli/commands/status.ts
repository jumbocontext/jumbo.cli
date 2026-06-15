import { Command } from 'commander';
import type { ReactElement } from 'react';
import type { RunHeartbeat, TestResult, ComparisonResult } from '../../domain/types.js';
import type { ResultStore } from '../../storage/result-store.js';
import {
  createHeartbeatView,
  formatHeartbeatDisplay,
  isHeartbeatComplete,
} from '../../output/heartbeat-display.js';

export interface StatusDeps {
  readonly storeProvider: () => Promise<ResultStore>;
}

const POLL_INTERVAL_MS = 1000;

/**
 * Registers the 'status' command.
 * Shows in-progress and completed runs with summary scores.
 */
export function registerStatusCommand(program: Command, deps: StatusDeps): void {
  program
    .command('status')
    .description('Show in-progress and completed runs with summary scores')
    .option('--scenario <id>', 'Filter by scenario ID')
    .option('--json', 'Output as JSON')
    .option('--watch <runId>', 'Watch a live run heartbeat by run ID')
    .addHelpText('after', `
Examples:
  eval status
  eval status --scenario abc123
  eval status --json
  eval status --watch <runId>
    `)
    .action(async (opts: { scenario?: string; json?: boolean; watch?: string }) => {
      const store = await deps.storeProvider();
      if (opts.watch) {
        await watchRunStatus(store, opts.watch);
        return;
      }

      const results = await store.listTestResults(opts.scenario);
      const comparisons: ComparisonResult[] = [];
      if (opts.json) {
        console.log(JSON.stringify({ results, comparisons }, null, 2));
      } else {
        console.log(formatStatusOutput(results, comparisons));
      }
    });
}

export interface WatchRunStatusOptions {
  readonly pollIntervalMs?: number;
  readonly isInteractive?: boolean;
}

export async function watchRunStatus(
  store: ResultStore,
  runId: string,
  options: WatchRunStatusOptions = {},
): Promise<void> {
  const pollIntervalMs = options.pollIntervalMs ?? POLL_INTERVAL_MS;
  const isInteractive = options.isInteractive ?? process.stdout.isTTY === true;

  if (!isInteractive) {
    await watchRunStatusNonInteractive(store, runId, pollIntervalMs);
    return;
  }

  await watchRunStatusInteractive(store, runId, pollIntervalMs);
}

async function watchRunStatusNonInteractive(
  store: ResultStore,
  runId: string,
  pollIntervalMs: number,
): Promise<void> {
  while (true) {
    const [heartbeat, runRecord] = await Promise.all([
      store.readHeartbeat(runId),
      store.getRunRecord(runId),
    ]);
    if (!heartbeat) {
      console.log(`No heartbeat found for run: ${runId}`);
      return;
    }
    const completed = isRunComplete(heartbeat, runRecord?.status);
    if (completed) {
      console.log(formatHeartbeatDisplay(heartbeat));
      return;
    }
    await delay(pollIntervalMs);
  }
}

async function watchRunStatusInteractive(
  store: ResultStore,
  runId: string,
  pollIntervalMs: number,
): Promise<void> {
  const ink = await import('ink');
  const React = await import('react');
  const element = createWatchAppElement(React, ink, { store, runId, pollIntervalMs });
  const instance = ink.render(element);

  const onSigint = (): void => {
    instance.unmount();
  };
  process.once('SIGINT', onSigint);
  try {
    await instance.waitUntilExit();
  } finally {
    process.removeListener('SIGINT', onSigint);
  }
}

interface WatchAppProps {
  readonly store: ResultStore;
  readonly runId: string;
  readonly pollIntervalMs: number;
}

/**
 * Exported for tests. Builds the root ink element for the watch view.
 * Accepts dynamically-loaded React and ink modules so the caller controls module
 * resolution (the project compiles to CJS while ink ships ESM-only).
 */
export function createWatchAppElement(
  React: typeof import('react'),
  ink: typeof import('ink', { with: { 'resolution-mode': 'import' } }),
  props: WatchAppProps,
): ReactElement {
  const { useApp } = ink;
  const { useEffect, useState, createElement } = React;

  const WatchApp = (): ReactElement => {
    const [heartbeat, setHeartbeat] = useState<RunHeartbeat | null>(null);
    const [missing, setMissing] = useState(false);
    const [done, setDone] = useState(false);
    const { exit } = useApp();

    useEffect(() => {
      if (!done && !missing) return;
      const id = setTimeout(() => exit(), 0);
      return (): void => clearTimeout(id);
    }, [done, missing, exit]);

    useEffect(() => {
      let cancelled = false;
      let timer: ReturnType<typeof setTimeout> | undefined;

      const tick = async (): Promise<void> => {
        try {
          const [hb, runRecord] = await Promise.all([
            props.store.readHeartbeat(props.runId),
            props.store.getRunRecord(props.runId),
          ]);
          if (cancelled) return;
          if (!hb) {
            setMissing(true);
            return;
          }
          setHeartbeat(hb);
          if (isRunComplete(hb, runRecord?.status)) {
            setDone(true);
            return;
          }
          timer = setTimeout(() => { void tick(); }, props.pollIntervalMs);
        } catch (err) {
          if (!cancelled) exit(err instanceof Error ? err : new Error(String(err)));
        }
      };

      void tick();

      return (): void => {
        cancelled = true;
        if (timer) clearTimeout(timer);
      };
    }, []);

    if (missing) {
      return createElement(ink.Text, null, `No heartbeat found for run: ${props.runId}`);
    }
    return createHeartbeatView(React, ink, { heartbeat });
  };

  return React.createElement(WatchApp);
}

function isRunComplete(heartbeat: RunHeartbeat, runStatus: string | undefined): boolean {
  return runStatus === 'completed' || runStatus === 'failed' || isHeartbeatComplete(heartbeat);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Formats status output for terminal display.
 * Shows test results grouped by scenario with session counts and completion status.
 * Pure function — no I/O.
 */
export function formatStatusOutput(
  results: readonly TestResult[],
  comparisons?: readonly ComparisonResult[],
): string {
  if (results.length === 0 && (!comparisons || comparisons.length === 0)) {
    return 'No runs found. Start one with: eval run --scenario <id> --image <image>';
  }

  const lines: string[] = [];
  const divider = '─'.repeat(60);

  // Group results by scenario
  const byScenario = new Map<string, TestResult[]>();
  for (const r of results) {
    const existing = byScenario.get(r.scenarioId) ?? [];
    existing.push(r);
    byScenario.set(r.scenarioId, existing);
  }

  lines.push(`  ${results.length} test result(s)`);
  if (comparisons && comparisons.length > 0) {
    lines.push(`  ${comparisons.length} comparison(s) completed`);
  }
  lines.push(divider);

  for (const [scenarioId, scenarioResults] of byScenario) {
    lines.push(`  Scenario: ${scenarioId}`);

    for (const r of scenarioResults) {
      lines.push(`    Result: ${r.id}`);
      lines.push(`      Harness:  ${r.harness}`);
      lines.push(`      Sessions: ${r.sessionRecords.length}`);
      lines.push(`      Created:  ${r.createdAt}`);
    }

    // Show comparison summaries for this scenario
    const scenarioComparisons = (comparisons ?? []).filter((c) => c.scenarioId === scenarioId);
    for (const comp of scenarioComparisons) {
      lines.push(`    Comparison: ${comp.id}`);
      lines.push(`      Harness: ${comp.harness}`);
      const avgDelta = comp.deltas.length > 0
        ? comp.deltas.reduce((sum, d) => sum + d.score, 0) / comp.deltas.length
        : 0;
      const sign = avgDelta > 0 ? '+' : '';
      lines.push(`      Avg Lift: ${sign}${avgDelta.toFixed(3)}`);
      lines.push(`      Dimensions: ${comp.jumboScores.length}`);
    }

    lines.push('');
  }

  return lines.join('\n');
}
