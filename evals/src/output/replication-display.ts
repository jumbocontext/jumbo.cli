import type { ReplicationReport } from '../domain/types.js';

/**
 * Renders an Outcome 5 replication report as a fixed-width table: per dimension,
 * the mean lift ± SD across replications, applicable replication count,
 * t-statistic, and whether the lift clears the one-SD signal bar.
 */
function pad(value: string, width: number): string {
  return value.length >= width ? value : value + ' '.repeat(width - value.length);
}

function signed(value: number): string {
  const fixed = value.toFixed(2);
  return value >= 0 ? `+${fixed}` : fixed;
}

export function formatReplicationReport(report: ReplicationReport): string {
  const header = `REPLICATION REPORT — scenario ${report.scenarioId} / ${report.harness} — K=${report.k}`;
  const tCritical = report.significance.tCriticalOneTailed05 === null
    ? 'n/a'
    : report.significance.tCriticalOneTailed05.toFixed(3);
  const lines: string[] = [
    header,
    '='.repeat(header.length),
    `significance: ${report.significance.rule}; one-tailed alpha=0.05 t-critical (df=${Math.max(report.k - 1, 0)}) = ${tCritical}`,
    report.significance.note,
    '',
    `${pad('dimension', 26)}${pad('mean lift', 12)}${pad('SD', 10)}${pad('applic.', 9)}${pad('t-stat', 10)}signal`,
    '-'.repeat(73),
  ];

  if (report.dimensions.length === 0) {
    lines.push('(no dimensions common to every replication)');
  }

  for (const d of report.dimensions) {
    lines.push(
      pad(d.dimension, 26) +
        pad(signed(d.meanLift), 12) +
        pad(d.sdLift.toFixed(2), 10) +
        pad(`${d.applicableReplications}/${d.k}`, 9) +
        pad(d.tStatistic.toFixed(2), 10) +
        (d.isSignal ? 'SIGNAL' : 'none'),
    );
  }

  return lines.join('\n');
}
