import type { DaemonEventRow } from "./DaemonEventRow.js";

const DAEMON_EVENT_SOURCE_WIDTH = 8;
const DAEMON_EVENT_CATEGORY_WIDTH = 12;

export const DaemonEventRowFormatter = {
  format,
} as const;

function format(row: DaemonEventRow): string {
  const message = row.message.length > 0 ? ` ${row.message}` : "";

  return `${formatEventTimestamp(row.timestampMs)} ${row.source.padEnd(DAEMON_EVENT_SOURCE_WIDTH)} ${row.category.padEnd(DAEMON_EVENT_CATEGORY_WIDTH)}${message}`;
}

function formatEventTimestamp(timestampMs: number): string {
  const date = new Date(timestampMs);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
}
