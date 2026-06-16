import type { ComparisonResult, DimensionScore } from '../domain/types.js';

/**
 * Pure function: takes ComparisonResults from multiple harnesses for the same
 * scenario and returns a formatted cross-harness comparison report.
 *
 * Shows side-by-side: for each dimension, the Jumbo lift (delta) per harness,
 * revealing which harnesses benefit most from Jumbo.
 */
export function formatCrossHarnessComparison(
  comparisons: readonly ComparisonResult[],
): string {
  if (comparisons.length === 0) {
    return 'No comparison results to display.';
  }

  if (comparisons.length === 1) {
    return 'Cross-harness comparison requires results from at least 2 harnesses.';
  }

  // Verify all comparisons are for the same scenario
  const scenarioIds = new Set(comparisons.map((c) => c.scenarioId));
  if (scenarioIds.size > 1) {
    return 'Error: comparisons span multiple scenarios. Cross-harness comparison requires a single scenario.';
  }

  const lines: string[] = [];
  const divider = '═'.repeat(72);
  const thinDivider = '─'.repeat(72);

  lines.push(divider);
  lines.push(`  Cross-Harness Comparison: ${comparisons[0].scenarioId}`);
  lines.push(`  Harnesses: ${comparisons.map((c) => c.harness).join(', ')}`);
  lines.push(divider);
  lines.push('');

  // Collect all dimensions across all comparisons
  const allDimensions = new Set<string>();
  for (const comp of comparisons) {
    for (const s of comp.jumboScores) allDimensions.add(s.dimension);
  }

  // Header row: Dimension | harness1 Jumbo | harness1 Base | harness1 Δ | harness2 ...
  const harnessNames = comparisons.map((c) => c.harness);

  // Jumbo lift table (delta per harness per dimension)
  lines.push('  JUMBO LIFT BY HARNESS (delta = jumbo - baseline)');
  lines.push(thinDivider);

  // Header
  const headerParts = [padRight('  Dimension', 24)];
  for (const name of harnessNames) {
    headerParts.push(padRight(name, 16));
  }
  lines.push(headerParts.join(''));
  lines.push(thinDivider);

  // Rows by dimension
  for (const dim of allDimensions) {
    const parts = [padRight(`  ${dim}`, 24)];

    for (const comp of comparisons) {
      const delta = comp.deltas.find((d) => d.dimension === dim);
      if (delta) {
        const sign = delta.score > 0 ? '+' : '';
        parts.push(padRight(`${sign}${delta.score.toFixed(2)}`, 16));
      } else {
        parts.push(padRight('  n/a', 16));
      }
    }

    lines.push(parts.join(''));
  }

  lines.push('');

  // Absolute scores table
  lines.push('  ABSOLUTE SCORES (Jumbo run)');
  lines.push(thinDivider);

  const absHeader = [padRight('  Dimension', 24)];
  for (const name of harnessNames) {
    absHeader.push(padRight(name, 16));
  }
  lines.push(absHeader.join(''));
  lines.push(thinDivider);

  for (const dim of allDimensions) {
    const parts = [padRight(`  ${dim}`, 24)];

    for (const comp of comparisons) {
      const score = comp.jumboScores.find((s) => s.dimension === dim);
      if (score) {
        parts.push(padRight(`${score.score.toFixed(2)}/${score.maxScore.toFixed(2)}`, 16));
      } else {
        parts.push(padRight('  n/a', 16));
      }
    }

    lines.push(parts.join(''));
  }

  lines.push('');

  // Summary: which harness benefits most from Jumbo
  lines.push('  SUMMARY');
  lines.push(thinDivider);

  for (const comp of comparisons) {
    const avgLift = comp.deltas.length > 0
      ? comp.deltas.reduce((sum, d) => sum + d.score, 0) / comp.deltas.length
      : 0;
    const sign = avgLift > 0 ? '+' : '';
    lines.push(`  ${padRight(comp.harness, 20)} avg lift: ${sign}${avgLift.toFixed(3)}`);
  }

  // Find best harness
  const ranked = comparisons
    .map((c) => ({
      harness: c.harness,
      avgLift: c.deltas.length > 0
        ? c.deltas.reduce((sum, d) => sum + d.score, 0) / c.deltas.length
        : 0,
    }))
    .sort((a, b) => b.avgLift - a.avgLift);

  lines.push('');
  lines.push(`  Highest Jumbo lift: ${ranked[0].harness} (${ranked[0].avgLift > 0 ? '+' : ''}${ranked[0].avgLift.toFixed(3)})`);

  lines.push(divider);

  return lines.join('\n');
}

function padRight(str: string, width: number): string {
  return str.length >= width ? str : str + ' '.repeat(width - str.length);
}
