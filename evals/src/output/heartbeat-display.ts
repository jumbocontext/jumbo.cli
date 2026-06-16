import type { ReactElement } from 'react';
import type { HarnessHeartbeat, RunHeartbeat, SessionHeartbeat } from '../domain/types.js';

export function formatHeartbeatDisplay(heartbeat: RunHeartbeat): string {
  const lines: string[] = [];
  lines.push(`Run: ${heartbeat.runId}`);
  lines.push(`Scenario: ${heartbeat.scenarioId}`);
  lines.push(`Updated: ${heartbeat.updatedAt}`);
  lines.push('─'.repeat(80));
  lines.push('Summary');
  lines.push(`${pad('Harness', 16)} ${pad('Variant', 8)} ${pad('Done', 6)} ${pad('Failed', 6)} ${pad('Running', 8)} Current`);

  for (const harness of heartbeat.harnesses) {
    const summary = summarizeHarness(harness);
    lines.push([
      pad(harness.harness, 16),
      pad(harness.variant, 8),
      pad(String(summary.completed), 6),
      pad(String(summary.failed), 6),
      pad(String(summary.running), 8),
      summary.current,
    ].join(' '));
  }

  lines.push('');
  lines.push('Sessions');
  lines.push(`${pad('Harness', 16)} ${pad('Variant', 8)} ${pad('Session', 7)} ${pad('Status', 9)} ${pad('Phase', 12)} ${pad('Elapsed', 9)} Details`);
  for (const harness of heartbeat.harnesses) {
    for (const session of harness.sessions) {
      lines.push(formatSessionRow(harness, session));
    }
  }

  return lines.join('\n');
}

export function isHeartbeatComplete(heartbeat: RunHeartbeat): boolean {
  return heartbeat.harnesses.every((harness) =>
    harness.sessions.every((session) => session.status === 'completed' || session.status === 'failed'),
  );
}

export interface HeartbeatViewProps {
  readonly heartbeat: RunHeartbeat | null;
  readonly missingMessage?: string;
}

/**
 * Builds an ink view element for a heartbeat snapshot.
 * Accepts the React and ink modules as dependencies so callers can use the
 * dynamically-imported (ESM) instances without re-importing them here.
 */
export function createHeartbeatView(
  React: typeof import('react'),
  ink: typeof import('ink', { with: { 'resolution-mode': 'import' } }),
  props: HeartbeatViewProps,
): ReactElement {
  const { Box, Text } = ink;
  if (!props.heartbeat) {
    return React.createElement(Text, null, props.missingMessage ?? 'No heartbeat available.');
  }
  return React.createElement(
    Box,
    { flexDirection: 'column' },
    React.createElement(Text, null, formatHeartbeatDisplay(props.heartbeat)),
  );
}

function summarizeHarness(harness: HarnessHeartbeat): {
  readonly completed: number;
  readonly failed: number;
  readonly running: number;
  readonly current: string;
} {
  const completed = harness.sessions.filter((session) => session.status === 'completed').length;
  const failed = harness.sessions.filter((session) => session.status === 'failed').length;
  const runningSessions = harness.sessions.filter((session) => session.status === 'running');
  const current = runningSessions[0] ?? harness.sessions.find((session) => session.status === 'failed');

  return {
    completed,
    failed,
    running: runningSessions.length,
    current: current ? formatCurrentSession(current) : '-',
  };
}

function formatCurrentSession(session: SessionHeartbeat): string {
  const phase = session.phase ?? session.status;
  const elapsed = activeElapsedMs(session);
  const elapsedText = elapsed === undefined ? '' : ` ${Math.round(elapsed)}ms`;
  const error = session.errorMessage ? ` ${session.errorMessage}` : '';
  return `s${session.sessionNumber} ${phase}${elapsedText}${error}`;
}

function formatSessionRow(harness: HarnessHeartbeat, session: SessionHeartbeat): string {
  const phase = session.phase ?? '-';
  const elapsed = activeElapsedMs(session) ?? completedElapsedMs(session);
  const elapsedText = elapsed === undefined ? '-' : `${Math.round(elapsed)}ms`;
  const details = session.errorMessage ?? '';
  return [
    pad(harness.harness, 16),
    pad(harness.variant, 8),
    pad(String(session.sessionNumber), 7),
    pad(session.status, 9),
    pad(phase, 12),
    pad(elapsedText, 9),
    details,
  ].join(' ');
}

function activeElapsedMs(session: SessionHeartbeat): number | undefined {
  if (session.status !== 'running' || !session.startedAt) return undefined;
  const start = Date.parse(session.startedAt);
  if (Number.isNaN(start)) return undefined;
  return Date.now() - start;
}

function completedElapsedMs(session: SessionHeartbeat): number | undefined {
  if (!session.startedAt || !session.completedAt) return undefined;
  const start = Date.parse(session.startedAt);
  const completed = Date.parse(session.completedAt);
  if (Number.isNaN(start) || Number.isNaN(completed)) return undefined;
  return Math.max(0, completed - start);
}

function pad(value: string, width: number): string {
  if (value.length >= width) return value;
  return `${value}${' '.repeat(width - value.length)}`;
}
