import { BaseColors } from "../../shared/DesignTokens.js";
import type {
  TuiDaemonEventSnapshot,
  TuiDaemonEventStatus,
  TuiDaemonName,
  TuiSubprocessSnapshot,
} from "../daemon-subprocesses/ISubprocessManager.js";
import { DEFAULT_WORKER_DAEMON_CONFIG } from "../../../application/daemons/WorkerDaemonCatalog.js";

const RENDERED_DAEMON_EVENT_LIMIT = 10;
const DAEMON_EVENT_SOURCE_WIDTH = 8;
const DAEMON_EVENT_CATEGORY_WIDTH = 12;

export interface DaemonEventRow {
  readonly key: string;
  readonly source: string;
  readonly category: string;
  readonly timestampMs: number;
  readonly message: string;
  readonly color: string;
}

export function findDaemonStatus(
  statuses: readonly TuiSubprocessSnapshot[],
  name: TuiDaemonName,
): TuiSubprocessSnapshot {
  return statuses.find((status) => status.name === name) ?? {
    name,
    status: "stopped",
    config: DEFAULT_WORKER_DAEMON_CONFIG,
    stdout: [],
    stderr: [],
    events: [],
  };
}

export function getDaemonEventRows(
  snapshots: readonly TuiSubprocessSnapshot[],
  observedAtMs: number,
): readonly DaemonEventRow[] {
  const rows = snapshots.flatMap((snapshot) => getSnapshotEventRows(snapshot, observedAtMs));

  return rows
    .sort((left, right) => right.timestampMs - left.timestampMs)
    .slice(0, RENDERED_DAEMON_EVENT_LIMIT);
}

export function appendDaemonEventRows(
  currentRows: readonly DaemonEventRow[],
  nextRows: readonly DaemonEventRow[],
): readonly DaemonEventRow[] {
  const currentKeys = new Set(currentRows.map((row) => row.key));
  const appendedRows = nextRows.filter((row) => !currentKeys.has(row.key));

  if (appendedRows.length === 0) {
    return currentRows;
  }

  return [...currentRows, ...appendedRows]
    .sort((left, right) => right.timestampMs - left.timestampMs)
    .slice(0, RENDERED_DAEMON_EVENT_LIMIT);
}

export function formatDaemonEventRow(row: DaemonEventRow): string {
  const message = row.message.length > 0 ? ` ${row.message}` : "";

  return `${formatEventTimestamp(row.timestampMs)} ${row.source.padEnd(DAEMON_EVENT_SOURCE_WIDTH)} ${row.category.padEnd(DAEMON_EVENT_CATEGORY_WIDTH)}${message}`;
}

function getSnapshotEventRows(
  snapshot: TuiSubprocessSnapshot,
  observedAtMs: number,
): readonly DaemonEventRow[] {
  const eventRows = snapshot.events
    .map((event, eventIndex) =>
      toDaemonEventRow(snapshot, event, eventIndex, observedAtMs)
    );
  const lifecycleRow = getLifecycleEventRow(snapshot, eventRows.length, observedAtMs);

  if (lifecycleRow === undefined) {
    return eventRows;
  }

  return [...eventRows, lifecycleRow];
}

function getLifecycleEventRow(
  snapshot: TuiSubprocessSnapshot,
  eventIndex: number,
  observedAtMs: number,
): DaemonEventRow | undefined {
  if (snapshot.status === "running" && snapshot.stopRequested === true) {
    return createDaemonEventRow(snapshot, "stopping", eventIndex, observedAtMs);
  }
  if (snapshot.status === "running" && snapshot.events.length === 0) {
    return createDaemonEventRow(snapshot, "starting", eventIndex, observedAtMs);
  }
  if (snapshot.status === "failed") {
    return createDaemonEventRow(snapshot, "failed", eventIndex, observedAtMs);
  }
  if (
    snapshot.status === "stopped"
    && (snapshot.stopRequested === true || snapshot.exitCode !== undefined || snapshot.exitSignal !== undefined)
  ) {
    return createDaemonEventRow(snapshot, "stopped", eventIndex, observedAtMs);
  }
  return undefined;
}

function createDaemonEventRow(
  snapshot: TuiSubprocessSnapshot,
  status: TuiDaemonEventStatus,
  eventIndex: number,
  observedAtMs: number,
): DaemonEventRow {
  return toDaemonEventRow(
    snapshot,
    {
      daemon: snapshot.name,
      status,
      errorMessage: snapshot.stderr[snapshot.stderr.length - 1],
      exitCode: snapshot.exitCode ?? undefined,
    },
    eventIndex,
    observedAtMs,
  );
}

function toDaemonEventRow(
  snapshot: TuiSubprocessSnapshot,
  event: TuiDaemonEventSnapshot,
  eventIndex: number,
  observedAtMs: number,
): DaemonEventRow {
  const status = normalizeDaemonEventStatus(event.status);
  const timestampMs = event.timestampMs ?? observedAtMs;
  const key = event.timestampMs === undefined
    ? `${snapshot.name}-lifecycle-${status}-${snapshot.pid ?? "none"}-${snapshot.exitCode ?? "none"}-${snapshot.stopRequested ?? false}`
    : `${snapshot.name}-${eventIndex}-${event.status}-${event.goalId ?? "none"}-${timestampMs}`;

  return {
    key,
    source: normalizeDaemonEventSource(snapshot, event),
    category: normalizeDaemonEventCategory(event, status),
    timestampMs,
    message: formatDaemonEventMessage(snapshot, event),
    color: getDaemonEventColor(status),
  };
}

function normalizeDaemonEventStatus(status: string): TuiDaemonEventStatus {
  if (status === "starting" || status === "stopping" || status === "stopped" || status === "failed" || status === "idle" || status === "processing" || status === "completed" || status === "skipped" || status === "exhausted" || status === "codifying") {
    return status;
  }

  return "processing";
}

function formatEventTimestamp(timestampMs: number): string {
  const date = new Date(timestampMs);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
}

function normalizeDaemonEventSource(
  snapshot: TuiSubprocessSnapshot,
  event: TuiDaemonEventSnapshot,
): string {
  return truncateTail(event.source ?? event.daemon ?? snapshot.name, DAEMON_EVENT_SOURCE_WIDTH);
}

function normalizeDaemonEventCategory(
  event: TuiDaemonEventSnapshot,
  status: TuiDaemonEventStatus,
): string {
  return truncateTail(event.category ?? status, DAEMON_EVENT_CATEGORY_WIDTH);
}

function formatDaemonEventMessage(
  snapshot: TuiSubprocessSnapshot,
  event: TuiDaemonEventSnapshot,
): string {
  const parts = [
    event.message === undefined || event.message.trim().length === 0 ? undefined : event.message.trim(),
    event.goalId === undefined ? undefined : shortGoalId(event.goalId),
    formatAttemptDetails(event),
    formatExitDetails(event),
    event.errorMessage ?? snapshot.stderr[snapshot.stderr.length - 1],
  ].filter((part): part is string => part !== undefined && part.length > 0);

  return truncateTail(parts.join(" "), 52);
}

function formatAttemptDetails(event: TuiDaemonEventSnapshot): string | undefined {
  if (event.attempt === undefined && event.maxRetries === undefined) {
    return undefined;
  }

  return `${event.attempt ?? "-"}/${event.maxRetries ?? "-"}`;
}

function formatExitDetails(event: TuiDaemonEventSnapshot): string | undefined {
  return event.exitCode === undefined ? undefined : `exit ${event.exitCode}`;
}

function getDaemonEventColor(status: TuiDaemonEventStatus): string {
  if (status === "failed") {
    return BaseColors.brandRed;
  }
  if (status === "completed") {
    return BaseColors.brandGreen;
  }
  if (status === "skipped" || status === "exhausted") {
    return BaseColors.brandYellow;
  }
  if (status === "processing" || status === "codifying" || status === "starting" || status === "stopping") {
    return BaseColors.brandBlue;
  }

  return BaseColors.shade4;
}

function shortGoalId(goalId: string | undefined): string {
  if (goalId === undefined) {
    return "-";
  }
  return goalId.length > 8 ? goalId.slice(0, 8) : goalId;
}

function truncateTail(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max - 3) + "...";
}
