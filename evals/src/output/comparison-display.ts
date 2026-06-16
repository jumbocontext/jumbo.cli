import type { ComparisonResult, DimensionScore, Disruption } from '../domain/types.js';

/**
 * Pure function: takes a ComparisonResult and returns formatted terminal output.
 * No I/O — caller is responsible for printing.
 */
export function formatComparisonOutput(comparison: ComparisonResult, disruptions?: readonly Disruption[]): string {
  const lines: string[] = [];
  const divider = '═'.repeat(60);
  const thinDivider = '─'.repeat(60);

  lines.push(divider);
  lines.push(`  A/B Comparison: ${comparison.scenarioId}`);
  lines.push(`  Harness: ${comparison.harness}`);
  lines.push(divider);
  lines.push('');

  // Session summaries
  lines.push('  JUMBO RUN (JUMBO_ENABLED=true)');
  lines.push(thinDivider);
  for (const record of comparison.jumboResult.sessionRecords) {
    lines.push(`  Session ${record.sessionNumber}: ${record.filesModified.length} files modified`);
    if (record.filesModified.length > 0) {
      lines.push(`    Files: ${record.filesModified.join(', ')}`);
    }
  }
  lines.push('');

  lines.push('  BASELINE RUN (JUMBO_ENABLED=false)');
  lines.push(thinDivider);
  for (const record of comparison.baselineResult.sessionRecords) {
    lines.push(`  Session ${record.sessionNumber}: ${record.filesModified.length} files modified`);
    if (record.filesModified.length > 0) {
      lines.push(`    Files: ${record.filesModified.join(', ')}`);
    }
  }
  lines.push('');

  // Scores side-by-side
  lines.push('  SCORES');
  lines.push(divider);
  lines.push(
    padRight('  Dimension', 24) +
    padRight('Jumbo', 12) +
    padRight('Baseline', 12) +
    'Delta',
  );
  lines.push(thinDivider);

  // Rendering convention for 'token-efficiency': Jumbo column holds the comparative
  // efficiency ratio (positive = Jumbo used fewer tokens per quality point than
  // baseline), Baseline column reads '(ref)' to mark it as the reference run, Delta
  // is omitted. Raw totals are emitted on the following line for context.
  for (let i = 0; i < comparison.jumboScores.length; i++) {
    const js = comparison.jumboScores[i];
    const bs = comparison.baselineScores[i];
    const delta = comparison.deltas[i];

    if (js.dimension === 'token-efficiency') {
      lines.push(
        padRight(`  ${js.dimension}`, 24) +
        padRight(formatSignedRatio(js.score), 12) +
        padRight('(ref)', 12) +
        '—',
      );
      const totals = js.details ?? bs.details;
      if (totals) {
        lines.push(`    └─ ${totals}`);
      }
      continue;
    }

    lines.push(
      padRight(`  ${js.dimension}`, 24) +
      padRight(formatScore(js), 12) +
      padRight(formatScore(bs), 12) +
      formatDelta(delta),
    );
  }

  const jumboMemoryScore = comparison.jumboScores.find((score) => score.dimension === 'jumbo-memory-capture');
  const baselineMemoryScore = comparison.baselineScores.find((score) => score.dimension === 'jumbo-memory-capture');
  if (jumboMemoryScore || baselineMemoryScore) {
    lines.push('');
    lines.push('  JUMBO MEMORY CAPTURE EVIDENCE');
    lines.push(thinDivider);
    if (jumboMemoryScore?.details) {
      lines.push(`  Jumbo: ${jumboMemoryScore.details}`);
    }
    if (baselineMemoryScore?.details) {
      lines.push(`  Baseline: ${baselineMemoryScore.details}`);
    }
  }

  const jumboProtocolScore = comparison.jumboScores.find((score) => score.dimension === 'protocol-adherence');
  const baselineProtocolScore = comparison.baselineScores.find((score) => score.dimension === 'protocol-adherence');
  if (jumboProtocolScore || baselineProtocolScore) {
    lines.push('');
    lines.push('  PROTOCOL ADHERENCE EVIDENCE');
    lines.push(thinDivider);
    if (jumboProtocolScore?.details) {
      lines.push(`  Jumbo: ${jumboProtocolScore.details}`);
    }
    if (baselineProtocolScore?.details) {
      lines.push(`  Baseline: ${baselineProtocolScore.details}`);
    }
  }

  // Per-session timeline (if multi-session)
  if (comparison.jumboTimeline && comparison.baselineTimeline && comparison.jumboTimeline.length > 1) {
    lines.push('');
    lines.push('  TIMELINE (per-session scores)');
    lines.push(divider);

    // Find all dimensions present in timeline
    const dimensions = new Set<string>();
    for (const ps of comparison.jumboTimeline) {
      for (const s of ps.scores) dimensions.add(s.dimension);
    }

    for (const dim of dimensions) {
      lines.push(`  ${dim}`);
      lines.push(
        padRight('  Session', 12) +
        padRight('Jumbo', 12) +
        padRight('Baseline', 12) +
        'Delta',
      );
      lines.push(thinDivider);

      for (let i = 0; i < comparison.jumboTimeline.length; i++) {
        const jt = comparison.jumboTimeline[i];
        const bt = comparison.baselineTimeline[i];

        // Mark disruption injection points
        const sessionDisruptions = (disruptions ?? []).filter((d) => d.sessionNumber === jt.sessionNumber);
        if (sessionDisruptions.length > 0) {
          for (const d of sessionDisruptions) {
            lines.push(`  >>> [${d.type.toUpperCase()}] ${d.content.slice(0, 50)}${d.content.length > 50 ? '...' : ''}`);
          }
        }

        const jScore = jt?.scores.find((s) => s.dimension === dim);
        const bScore = bt?.scores.find((s) => s.dimension === dim);

        if (jScore && bScore) {
          if (dim === 'token-usage') {
            // Raw totals: 'token-usage' carries totalTokens in `score`. Render absolute
            // counts (jumbo / baseline / signed difference) — no fake 0–1 score.
            const diff = jScore.score - bScore.score;
            const sign = diff > 0 ? '+' : '';
            lines.push(
              padRight(`  ${jt.sessionNumber}`, 12) +
              padRight(`${jScore.score}`, 12) +
              padRight(`${bScore.score}`, 12) +
              `${sign}${diff}`,
            );
          } else {
            const delta = Math.round((jScore.score - bScore.score) * 100) / 100;
            const sign = delta > 0 ? '+' : '';
            lines.push(
              padRight(`  ${jt.sessionNumber}`, 12) +
              padRight(formatScore(jScore), 12) +
              padRight(formatScore(bScore), 12) +
              `${sign}${delta.toFixed(2)}`,
            );
          }
        }
      }
      lines.push('');
    }
  }

  lines.push(divider);

  return lines.join('\n');
}

function formatSignedRatio(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}`;
}

function formatScore(score: DimensionScore): string {
  return `${score.score.toFixed(2)}/${score.maxScore.toFixed(2)}`;
}

function formatDelta(delta: DimensionScore): string {
  const sign = delta.score > 0 ? '+' : '';
  return `${sign}${delta.score.toFixed(2)}`;
}

function padRight(str: string, width: number): string {
  return str.length >= width ? str : str + ' '.repeat(width - str.length);
}
