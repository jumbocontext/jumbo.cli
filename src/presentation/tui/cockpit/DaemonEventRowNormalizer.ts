import { BaseColors } from "../../shared/DesignTokens.js";
import type {
  TuiDaemonEventSnapshot,
  TuiDaemonEventStatus,
  TuiSubprocessSnapshot,
} from "../daemon-subprocesses/ISubprocessManager.js";
import { TuiDaemonEventStatus as TuiDaemonEventStatusValues } from "../daemon-subprocesses/TuiDaemonEventStatus.js";
import { TuiSubprocessStatus } from "../daemon-subprocesses/TuiSubprocessStatus.js";
import type { DaemonEventRow } from "./DaemonEventRow.js";
import { DaemonEventRowMessageFormatter } from "./DaemonEventRowMessageFormatter.js";

const DAEMON_EVENT_SOURCE_WIDTH = 8;
const DAEMON_EVENT_CATEGORY_WIDTH = 12;

export const DaemonEventRowNormalizer = {
  fromSnapshot,
} as const;

function fromSnapshot(
  snapshot: TuiSubprocessSnapshot,
  observedAtMs: number,
): readonly DaemonEventRow[] {
  const eventRows = snapshot.events.map((event, eventIndex) =>
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
  if (
    snapshot.status === TuiSubprocessStatus.STOPPING
  ) {
    return createDaemonEventRow(
      snapshot,
      TuiDaemonEventStatusValues.STOPPING,
      eventIndex,
      observedAtMs,
    );
  }
  if (
    snapshot.status === TuiSubprocessStatus.RUNNING &&
    snapshot.events.length === 0
  ) {
    return createDaemonEventRow(
      snapshot,
      TuiDaemonEventStatusValues.STARTING,
      eventIndex,
      observedAtMs,
    );
  }
  if (snapshot.status === TuiSubprocessStatus.FAILED) {
    return createDaemonEventRow(
      snapshot,
      TuiDaemonEventStatusValues.FAILED,
      eventIndex,
      observedAtMs,
    );
  }
  if (
    snapshot.status === TuiSubprocessStatus.STOPPED &&
    (
      snapshot.stopRequested === true ||
      snapshot.exitCode !== undefined ||
      snapshot.exitSignal !== undefined
    )
  ) {
    return createDaemonEventRow(
      snapshot,
      TuiDaemonEventStatusValues.STOPPED,
      eventIndex,
      observedAtMs,
    );
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
    message: DaemonEventRowMessageFormatter.format(snapshot, event),
    color: getDaemonEventColor(status),
  };
}

function normalizeDaemonEventStatus(status: string): TuiDaemonEventStatus {
  if (
    Object.values(TuiDaemonEventStatusValues).includes(
      status as TuiDaemonEventStatus,
    )
  ) {
    return status as TuiDaemonEventStatus;
  }

  return TuiDaemonEventStatusValues.PROCESSING;
}

function normalizeDaemonEventSource(
  snapshot: TuiSubprocessSnapshot,
  event: TuiDaemonEventSnapshot,
): string {
  return truncateTail(
    event.source ?? event.daemon ?? snapshot.name,
    DAEMON_EVENT_SOURCE_WIDTH,
  );
}

function normalizeDaemonEventCategory(
  event: TuiDaemonEventSnapshot,
  status: TuiDaemonEventStatus,
): string {
  return truncateTail(event.category ?? status, DAEMON_EVENT_CATEGORY_WIDTH);
}

function getDaemonEventColor(status: TuiDaemonEventStatus): string {
  if (status === TuiDaemonEventStatusValues.FAILED) {
    return BaseColors.brandRed;
  }
  if (status === TuiDaemonEventStatusValues.COMPLETED) {
    return BaseColors.brandGreen;
  }
  if (
    status === TuiDaemonEventStatusValues.SKIPPED ||
    status === TuiDaemonEventStatusValues.EXHAUSTED
  ) {
    return BaseColors.brandYellow;
  }
  if (
    status === TuiDaemonEventStatusValues.PROCESSING ||
    status === TuiDaemonEventStatusValues.CODIFYING ||
    status === TuiDaemonEventStatusValues.STARTING ||
    status === TuiDaemonEventStatusValues.STOPPING
  ) {
    return BaseColors.brandBlue;
  }

  return BaseColors.shade4;
}

function truncateTail(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max - 3) + "...";
}
