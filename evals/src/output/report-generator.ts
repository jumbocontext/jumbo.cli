import type { ComparisonResult, DimensionScore, Disruption, SessionRecord, TamperEvent, WorkspaceSnapshot } from '../domain/types.js';

/**
 * A single point on the divergence curve: per-session delta between Jumbo and baseline.
 */
export interface DivergencePoint {
  readonly sessionNumber: number;
  readonly dimension: string;
  readonly jumboScore: number;
  readonly baselineScore: number;
  readonly delta: number;
}

/**
 * Lift percentage for a single dimension.
 */
export interface LiftResult {
  readonly dimension: string;
  readonly jumboScore: number;
  readonly baselineScore: number;
  readonly absoluteLift: number;
  readonly percentageLift: number | null; // null when baseline is zero
}

/**
 * Identifies when amnesia impact becomes significant.
 */
export interface DivergenceOnset {
  readonly dimension: string;
  readonly onsetSession: number | null; // null if no significant divergence detected
  readonly threshold: number;
  readonly deltaAtOnset: number | null;
}

/**
 * Ranks disruptions by their impact on the delta.
 */
export interface DisruptionImpact {
  readonly disruption: Disruption;
  readonly dimension: string;
  readonly deltaBeforeDisruption: number;
  readonly deltaAfterDisruption: number;
  readonly impactMagnitude: number;
}

/**
 * Aggregated lift per harness.
 */
export interface HarnessLiftSummary {
  readonly harness: string;
  readonly avgLift: number;
  readonly dimensionLifts: readonly LiftResult[];
}

export interface MemoryCaptureEvidence {
  readonly harness: string;
  readonly jumboScore: number;
  readonly jumboDetails?: string;
  readonly baselineDetails?: string;
}

export interface ProtocolAdherenceEvidence {
  readonly harness: string;
  readonly jumboScore: number;
  readonly jumboDetails?: string;
  readonly baselineDetails?: string;
  readonly perSession: readonly {
    readonly sessionNumber: number;
    readonly score: number;
    readonly details?: string;
  }[];
}

/**
 * Audit data tying a measured delta back to its inputs and outputs.
 *
 * For each variant the trail records the effective context delivered per
 * session, the final workspace snapshot evidence, and the per-dimension
 * scoring evidence. This is what makes a measured delta explainable —
 * a reader can see why scores diverged, not just that they did.
 *
 * Methodology note: deltas attribute to the whole Jumbo system armed
 * against a parity-matched baseline agent under framework-as-developer
 * orchestration with agent-driven lifecycle (the framework hands the
 * agent an active goal-id and lifecycle protocol; the agent itself runs
 * every jumbo lifecycle call). Headline lift is not a memory-delivery
 * number in isolation.
 */
export interface SessionContextAudit {
  readonly sessionNumber: number;
  readonly scenarioPrompt?: string;
  readonly effectivePrompt?: string;
  readonly deliveredContext?: string;
}

export interface DimensionEvidence {
  readonly dimension: string;
  readonly jumboScore: number;
  readonly baselineScore: number;
  readonly delta: number;
  readonly jumboDetails?: string;
  readonly baselineDetails?: string;
}

export interface AuditTrail {
  readonly harness: string;
  readonly jumboContext: readonly SessionContextAudit[];
  readonly baselineContext: readonly SessionContextAudit[];
  readonly jumboFinalSnapshot?: WorkspaceSnapshot;
  readonly baselineFinalSnapshot?: WorkspaceSnapshot;
  readonly scoringEvidence: readonly DimensionEvidence[];
}

/**
 * Complete structured report.
 */
export interface TamperedComparisonSummary {
  readonly comparisonId: string;
  readonly harness: string;
  readonly tamperLog: readonly TamperEvent[];
}

export interface FullReport {
  readonly scenarioId: string;
  readonly harnesses: readonly string[];
  readonly divergenceCurve: readonly DivergencePoint[];
  readonly liftResults: readonly LiftResult[];
  readonly divergenceOnsets: readonly DivergenceOnset[];
  readonly disruptionImpacts: readonly DisruptionImpact[];
  readonly memoryCaptureEvidence: readonly MemoryCaptureEvidence[];
  readonly protocolAdherenceEvidence: readonly ProtocolAdherenceEvidence[];
  readonly harnessAggregation: readonly HarnessLiftSummary[];
  readonly auditTrails: readonly AuditTrail[];
  readonly tamperedComparisons: readonly TamperedComparisonSummary[];
  readonly generatedAt: string;
}

/**
 * Computes the session-by-session divergence curve from timelines.
 * Returns per-session, per-dimension deltas showing how Jumbo and baseline diverge.
 */
export function computeDivergenceCurve(comparison: ComparisonResult): DivergencePoint[] {
  const points: DivergencePoint[] = [];

  if (!comparison.jumboTimeline || !comparison.baselineTimeline) return points;

  for (let i = 0; i < comparison.jumboTimeline.length; i++) {
    const jSession = comparison.jumboTimeline[i];
    const bSession = comparison.baselineTimeline[i];
    if (!jSession || !bSession) continue;

    for (const jScore of jSession.scores) {
      const bScore = bSession.scores.find((s) => s.dimension === jScore.dimension);
      if (!bScore) continue;

      points.push({
        sessionNumber: jSession.sessionNumber,
        dimension: jScore.dimension,
        jumboScore: jScore.score,
        baselineScore: bScore.score,
        delta: Math.round((jScore.score - bScore.score) * 1000) / 1000,
      });
    }
  }

  return points;
}

/**
 * Computes per-dimension lift percentages from aggregate scores.
 */
export function computeLiftPercentages(comparison: ComparisonResult): LiftResult[] {
  return comparison.jumboScores.map((js, i) => {
    const bs = comparison.baselineScores[i];
    const absoluteLift = Math.round((js.score - bs.score) * 1000) / 1000;
    const percentageLift = bs.score !== 0
      ? Math.round(((js.score - bs.score) / bs.score) * 10000) / 100
      : null;

    return {
      dimension: js.dimension,
      jumboScore: js.score,
      baselineScore: bs.score,
      absoluteLift,
      percentageLift,
    };
  });
}

/**
 * Detects the session number where divergence becomes significant.
 * A dimension diverges when the delta exceeds the threshold for the first time.
 */
export function detectDivergenceOnset(
  divergenceCurve: readonly DivergencePoint[],
  threshold: number = 0.1,
): DivergenceOnset[] {
  const dimensions = [...new Set(divergenceCurve.map((p) => p.dimension))];

  return dimensions.map((dim) => {
    const points = divergenceCurve
      .filter((p) => p.dimension === dim)
      .sort((a, b) => a.sessionNumber - b.sessionNumber);

    const onsetPoint = points.find((p) => Math.abs(p.delta) >= threshold);

    return {
      dimension: dim,
      onsetSession: onsetPoint ? onsetPoint.sessionNumber : null,
      threshold,
      deltaAtOnset: onsetPoint ? onsetPoint.delta : null,
    };
  });
}

/**
 * Analyzes the impact of disruptions on Jumbo vs baseline deltas.
 * For each disruption, computes the delta change before and after injection.
 */
export function analyzeDisruptionImpact(
  divergenceCurve: readonly DivergencePoint[],
  disruptions: readonly Disruption[],
): DisruptionImpact[] {
  const impacts: DisruptionImpact[] = [];

  const dimensions = [...new Set(divergenceCurve.map((p) => p.dimension))];

  for (const disruption of disruptions) {
    for (const dim of dimensions) {
      const points = divergenceCurve
        .filter((p) => p.dimension === dim)
        .sort((a, b) => a.sessionNumber - b.sessionNumber);

      const beforePoint = points.find((p) => p.sessionNumber === disruption.sessionNumber - 1);
      const afterPoint = points.find((p) => p.sessionNumber === disruption.sessionNumber)
        ?? points.find((p) => p.sessionNumber === disruption.sessionNumber + 1);

      const deltaBeforeDisruption = beforePoint?.delta ?? 0;
      const deltaAfterDisruption = afterPoint?.delta ?? 0;

      impacts.push({
        disruption,
        dimension: dim,
        deltaBeforeDisruption,
        deltaAfterDisruption,
        impactMagnitude: Math.round(
          Math.abs(deltaAfterDisruption - deltaBeforeDisruption) * 1000,
        ) / 1000,
      });
    }
  }

  // Sort by impact magnitude descending
  return impacts.sort((a, b) => b.impactMagnitude - a.impactMagnitude);
}

/**
 * Aggregates lift across multiple harnesses for the same scenario.
 */
export function aggregateHarnessLifts(
  comparisons: readonly ComparisonResult[],
): HarnessLiftSummary[] {
  return comparisons.map((comp) => {
    const lifts = computeLiftPercentages(comp);
    const avgLift = lifts.length > 0
      ? Math.round(
          (lifts.reduce((sum, l) => sum + l.absoluteLift, 0) / lifts.length) * 1000,
        ) / 1000
      : 0;

    return {
      harness: comp.harness,
      avgLift,
      dimensionLifts: lifts,
    };
  });
}

export function extractMemoryCaptureEvidence(
  comparisons: readonly ComparisonResult[],
): MemoryCaptureEvidence[] {
  return comparisons.flatMap((comparison) => {
    const jumboScore = comparison.jumboScores.find((score) => score.dimension === 'jumbo-memory-capture');
    if (!jumboScore) return [];
    const baselineScore = comparison.baselineScores.find((score) => score.dimension === 'jumbo-memory-capture');
    return [{
      harness: comparison.harness,
      jumboScore: jumboScore.score,
      jumboDetails: jumboScore.details,
      baselineDetails: baselineScore?.details,
    }];
  });
}

export function extractProtocolAdherenceEvidence(
  comparisons: readonly ComparisonResult[],
): ProtocolAdherenceEvidence[] {
  return comparisons.flatMap((comparison) => {
    const jumboScore = comparison.jumboScores.find((score) => score.dimension === 'protocol-adherence');
    if (!jumboScore) return [];
    const baselineScore = comparison.baselineScores.find((score) => score.dimension === 'protocol-adherence');
    const perSession = (comparison.jumboTimeline ?? []).map((ps) => {
      const protocolScore = ps.scores.find((s) => s.dimension === 'protocol-adherence');
      return {
        sessionNumber: ps.sessionNumber,
        score: protocolScore?.score ?? 0,
        details: protocolScore?.details,
      };
    });
    return [{
      harness: comparison.harness,
      jumboScore: jumboScore.score,
      jumboDetails: jumboScore.details,
      baselineDetails: baselineScore?.details,
      perSession,
    }];
  });
}

function summarizeRecordContext(record: SessionRecord): SessionContextAudit {
  return {
    sessionNumber: record.sessionNumber,
    scenarioPrompt: record.scenarioPrompt,
    effectivePrompt: record.effectivePrompt,
    deliveredContext: record.deliveredContext,
  };
}

function lastRecord(records: readonly SessionRecord[]): SessionRecord | undefined {
  if (records.length === 0) return undefined;
  return records.reduce((latest, r) => (r.sessionNumber > latest.sessionNumber ? r : latest));
}

export function buildAuditTrail(comparison: ComparisonResult): AuditTrail {
  const jumboRecords = comparison.jumboResult.sessionRecords;
  const baselineRecords = comparison.baselineResult.sessionRecords;

  const scoringEvidence: DimensionEvidence[] = comparison.jumboScores.map((js, i) => {
    const bs = comparison.baselineScores[i];
    return {
      dimension: js.dimension,
      jumboScore: js.score,
      baselineScore: bs?.score ?? 0,
      delta: Math.round((js.score - (bs?.score ?? 0)) * 1000) / 1000,
      jumboDetails: js.details,
      baselineDetails: bs?.details,
    };
  });

  return {
    harness: comparison.harness,
    jumboContext: jumboRecords.map(summarizeRecordContext),
    baselineContext: baselineRecords.map(summarizeRecordContext),
    jumboFinalSnapshot: lastRecord(jumboRecords)?.workspaceSnapshot,
    baselineFinalSnapshot: lastRecord(baselineRecords)?.workspaceSnapshot,
    scoringEvidence,
  };
}

/**
 * Generates a complete structured report from one or more ComparisonResults.
 * Pure function — no I/O.
 */
export function generateFullReport(
  comparisons: readonly ComparisonResult[],
  disruptions: readonly Disruption[] = [],
  tamperedExcluded: readonly ComparisonResult[] = [],
): FullReport {
  const primary = comparisons[0];
  const divergenceCurves = comparisons.flatMap(computeDivergenceCurve);
  const liftResults = primary ? computeLiftPercentages(primary) : [];
  const divergenceOnsets = detectDivergenceOnset(divergenceCurves);
  const disruptionImpacts = analyzeDisruptionImpact(divergenceCurves, disruptions);
  const memoryCaptureEvidence = extractMemoryCaptureEvidence(comparisons);
  const protocolAdherenceEvidence = extractProtocolAdherenceEvidence(comparisons);
  const harnessAggregation = aggregateHarnessLifts(comparisons);
  const auditTrails = comparisons.map(buildAuditTrail);

  return {
    scenarioId: primary?.scenarioId ?? '',
    harnesses: comparisons.map((c) => c.harness),
    divergenceCurve: divergenceCurves,
    liftResults,
    divergenceOnsets,
    disruptionImpacts,
    memoryCaptureEvidence,
    protocolAdherenceEvidence,
    harnessAggregation,
    auditTrails,
    tamperedComparisons: tamperedExcluded.map((c) => ({
      comparisonId: c.id,
      harness: c.harness,
      tamperLog: c.tamperLog,
    })),
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Formats the full report as polished terminal output.
 */
export function formatFullReport(report: FullReport): string {
  const lines: string[] = [];
  const divider = '═'.repeat(72);
  const thinDivider = '─'.repeat(72);

  lines.push(divider);
  lines.push(`  JUMBO EVALUATION REPORT`);
  lines.push(`  Scenario: ${report.scenarioId}`);
  lines.push(`  Harnesses: ${report.harnesses.join(', ')}`);
  lines.push(`  Treatment: whole Jumbo system vs Jumbo-unreachable baseline`);
  lines.push(`  Methodology: framework-as-developer orchestration, agent-driven lifecycle`);
  lines.push(`  Lift attribution: init + pre-seeded memory + lifecycle protocol + agent capture + audit`);
  lines.push(divider);
  lines.push('');

  // Lift percentages
  lines.push('  LIFT BY DIMENSION');
  lines.push(thinDivider);
  lines.push(
    padRight('  Dimension', 24) +
    padRight('Jumbo', 10) +
    padRight('Base', 10) +
    padRight('Lift', 10) +
    'Lift %',
  );
  lines.push(thinDivider);

  for (const lift of report.liftResults) {
    const pctStr = lift.percentageLift !== null ? `${lift.percentageLift > 0 ? '+' : ''}${lift.percentageLift.toFixed(1)}%` : 'n/a';
    const sign = lift.absoluteLift > 0 ? '+' : '';
    lines.push(
      padRight(`  ${lift.dimension}`, 24) +
      padRight(lift.jumboScore.toFixed(2), 10) +
      padRight(lift.baselineScore.toFixed(2), 10) +
      padRight(`${sign}${lift.absoluteLift.toFixed(3)}`, 10) +
      pctStr,
    );
  }
  lines.push('');

  // Divergence onset
  if (report.divergenceOnsets.length > 0) {
    lines.push('  DIVERGENCE ONSET (session where amnesia impact exceeds threshold)');
    lines.push(thinDivider);

    for (const onset of report.divergenceOnsets) {
      if (onset.onsetSession !== null) {
        const sign = onset.deltaAtOnset! > 0 ? '+' : '';
        lines.push(`  ${padRight(onset.dimension, 22)} session ${onset.onsetSession} (delta: ${sign}${onset.deltaAtOnset!.toFixed(3)}, threshold: ${onset.threshold})`);
      } else {
        lines.push(`  ${padRight(onset.dimension, 22)} no significant divergence detected`);
      }
    }
    lines.push('');
  }

  // Divergence curve
  if (report.divergenceCurve.length > 0) {
    lines.push('  DIVERGENCE CURVE (session-by-session delta)');
    lines.push(thinDivider);

    const dimensions = [...new Set(report.divergenceCurve.map((p) => p.dimension))];

    for (const dim of dimensions) {
      const points = report.divergenceCurve
        .filter((p) => p.dimension === dim)
        .sort((a, b) => a.sessionNumber - b.sessionNumber);

      const bars = points.map((p) => {
        const sign = p.delta > 0 ? '+' : '';
        return `S${p.sessionNumber}:${sign}${p.delta.toFixed(2)}`;
      }).join('  ');

      lines.push(`  ${padRight(dim, 22)} ${bars}`);
    }
    lines.push('');
  }

  if (report.memoryCaptureEvidence.length > 0) {
    lines.push('  JUMBO MEMORY CAPTURE EVIDENCE');
    lines.push(thinDivider);

    for (const evidence of report.memoryCaptureEvidence) {
      lines.push(`  ${padRight(evidence.harness, 20)} score: ${evidence.jumboScore.toFixed(2)}`);
      if (evidence.jumboDetails) {
        lines.push(`    Jumbo: ${evidence.jumboDetails}`);
      }
      if (evidence.baselineDetails) {
        lines.push(`    Baseline: ${evidence.baselineDetails}`);
      }
    }
    lines.push('');
  }

  // Protocol adherence — first-class signal for lifecycle non-adherence.
  if (report.protocolAdherenceEvidence.length > 0) {
    lines.push('  PROTOCOL ADHERENCE EVIDENCE (per-step lifecycle execution)');
    lines.push(thinDivider);

    for (const evidence of report.protocolAdherenceEvidence) {
      lines.push(`  ${padRight(evidence.harness, 20)} score: ${evidence.jumboScore.toFixed(2)}`);
      if (evidence.jumboDetails) {
        lines.push(`    Jumbo: ${evidence.jumboDetails}`);
      }
      if (evidence.baselineDetails) {
        lines.push(`    Baseline: ${evidence.baselineDetails}`);
      }
      for (const session of evidence.perSession) {
        const sessionLine = `    S${session.sessionNumber}: ${session.score.toFixed(2)}` +
          (session.details ? ` (${session.details})` : '');
        lines.push(sessionLine);
      }
    }
    lines.push('');
  }

  // Disruption impact
  if (report.disruptionImpacts.length > 0) {
    lines.push('  DISRUPTION IMPACT (ranked by magnitude)');
    lines.push(thinDivider);

    const top = report.disruptionImpacts.slice(0, 10);
    for (const impact of top) {
      lines.push(
        `  [${impact.disruption.type}] S${impact.disruption.sessionNumber} ` +
        `${padRight(impact.dimension, 20)} ` +
        `before:${impact.deltaBeforeDisruption >= 0 ? '+' : ''}${impact.deltaBeforeDisruption.toFixed(3)} ` +
        `after:${impact.deltaAfterDisruption >= 0 ? '+' : ''}${impact.deltaAfterDisruption.toFixed(3)} ` +
        `magnitude:${impact.impactMagnitude.toFixed(3)}`,
      );
    }
    lines.push('');
  }

  // Harness aggregation
  if (report.harnessAggregation.length > 1) {
    lines.push('  CROSS-HARNESS AGGREGATION');
    lines.push(thinDivider);

    const sorted = [...report.harnessAggregation].sort((a, b) => b.avgLift - a.avgLift);
    for (const h of sorted) {
      const sign = h.avgLift > 0 ? '+' : '';
      lines.push(`  ${padRight(h.harness, 20)} avg lift: ${sign}${h.avgLift.toFixed(3)}`);
    }
    lines.push('');
  }

  // Audit trail — explains why a measured delta occurred
  if (report.auditTrails.length > 0) {
    lines.push('  AUDIT TRAIL (effective context, final snapshot, scoring evidence)');
    lines.push(thinDivider);

    for (const trail of report.auditTrails) {
      lines.push(`  ${trail.harness}`);

      const lastJumbo = trail.jumboContext.at(-1);
      const lastBaseline = trail.baselineContext.at(-1);
      if (lastJumbo) {
        const delivered = compactAuditText(lastJumbo.deliveredContext, 80) ?? 'none';
        lines.push(`    Jumbo final session ${lastJumbo.sessionNumber} delivered context: ${delivered}`);
      }
      if (lastBaseline) {
        const effective = compactAuditText(lastBaseline.effectivePrompt, 80) ?? 'n/a';
        lines.push(`    Baseline final session ${lastBaseline.sessionNumber} effective prompt: ${effective}`);
      }

      const jumboFiles = trail.jumboFinalSnapshot?.files.map((f) => f.path) ?? [];
      const baselineFiles = trail.baselineFinalSnapshot?.files.map((f) => f.path) ?? [];
      lines.push(`    Jumbo final snapshot files: ${jumboFiles.length > 0 ? jumboFiles.join(', ') : '(none)'}`);
      lines.push(`    Baseline final snapshot files: ${baselineFiles.length > 0 ? baselineFiles.join(', ') : '(none)'}`);

      for (const evidence of trail.scoringEvidence) {
        const sign = evidence.delta > 0 ? '+' : '';
        lines.push(
          `    ${padRight(evidence.dimension, 22)} jumbo=${evidence.jumboScore.toFixed(2)} ` +
          `baseline=${evidence.baselineScore.toFixed(2)} delta=${sign}${evidence.delta.toFixed(3)}`,
        );
        if (evidence.jumboDetails) lines.push(`      jumbo: ${evidence.jumboDetails}`);
        if (evidence.baselineDetails) lines.push(`      baseline: ${evidence.baselineDetails}`);
      }
    }
    lines.push('');
  }

  lines.push(divider);

  return lines.join('\n');
}

function compactAuditText(value: string | undefined, maxLength: number): string | undefined {
  if (value === undefined) return undefined;
  const compacted = value.replace(/\s+/g, ' ').trim();
  if (compacted.length === 0) return undefined;
  if (compacted.length <= maxLength) return compacted;
  return `${compacted.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

function padRight(str: string, width: number): string {
  return str.length >= width ? str : str + ' '.repeat(width - str.length);
}
