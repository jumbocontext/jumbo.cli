import type { SubprocessSnapshot } from "../daemon-subprocesses/ISubprocessManager.js";
import type { DaemonEventRow } from "./DaemonEventRow.js";
import { DaemonEventRowNormalizer } from "./DaemonEventRowNormalizer.js";

const RENDERED_DAEMON_EVENT_LIMIT = 10;

export const DaemonEventRows = {
  append,
  fromSnapshots,
} as const;

function fromSnapshots(
  snapshots: readonly SubprocessSnapshot[],
  observedAtMs: number,
): readonly DaemonEventRow[] {
  const rows = snapshots.flatMap((snapshot) =>
    DaemonEventRowNormalizer.fromSnapshot(snapshot, observedAtMs)
  );

  return newestFirst(rows).slice(0, RENDERED_DAEMON_EVENT_LIMIT);
}

function append(
  currentRows: readonly DaemonEventRow[],
  nextRows: readonly DaemonEventRow[],
): readonly DaemonEventRow[] {
  const currentKeys = new Set(currentRows.map((row) => row.key));
  const appendedRows = nextRows.filter((row) => !currentKeys.has(row.key));

  if (appendedRows.length === 0) {
    return currentRows;
  }

  return newestFirst([...currentRows, ...appendedRows]).slice(
    0,
    RENDERED_DAEMON_EVENT_LIMIT,
  );
}

function newestFirst(rows: readonly DaemonEventRow[]): readonly DaemonEventRow[] {
  return [...rows].sort((left, right) => right.timestampMs - left.timestampMs);
}
