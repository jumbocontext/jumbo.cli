import type { FullReport } from './report-generator.js';

/**
 * Converts a FullReport to a JSON string for external consumption.
 * The JSON format is designed for documentation and marketing use.
 *
 * Pure function — no I/O. Caller is responsible for writing to disk.
 */
export function exportReportAsJson(report: FullReport): string {
  const exportData = {
    meta: {
      format: 'jumbo-eval-report',
      version: 1,
      generatedAt: report.generatedAt,
      scenarioId: report.scenarioId,
      harnesses: report.harnesses,
    },
    lift: {
      byDimension: report.liftResults.map((l) => ({
        dimension: l.dimension,
        jumboScore: l.jumboScore,
        baselineScore: l.baselineScore,
        absoluteLift: l.absoluteLift,
        percentageLift: l.percentageLift,
      })),
    },
    divergence: {
      curve: report.divergenceCurve.map((p) => ({
        session: p.sessionNumber,
        dimension: p.dimension,
        jumbo: p.jumboScore,
        baseline: p.baselineScore,
        delta: p.delta,
      })),
      onsets: report.divergenceOnsets.map((o) => ({
        dimension: o.dimension,
        onsetSession: o.onsetSession,
        threshold: o.threshold,
        deltaAtOnset: o.deltaAtOnset,
      })),
    },
    disruptions: {
      impacts: report.disruptionImpacts.map((i) => ({
        type: i.disruption.type,
        session: i.disruption.sessionNumber,
        content: i.disruption.content,
        dimension: i.dimension,
        deltaBefore: i.deltaBeforeDisruption,
        deltaAfter: i.deltaAfterDisruption,
        magnitude: i.impactMagnitude,
      })),
    },
    memoryCapture: {
      evidence: report.memoryCaptureEvidence.map((e) => ({
        harness: e.harness,
        jumboScore: e.jumboScore,
        jumboDetails: e.jumboDetails,
        baselineDetails: e.baselineDetails,
      })),
    },
    audit: {
      trails: report.auditTrails.map((t) => ({
        harness: t.harness,
        jumboContext: t.jumboContext,
        baselineContext: t.baselineContext,
        jumboFinalSnapshot: t.jumboFinalSnapshot,
        baselineFinalSnapshot: t.baselineFinalSnapshot,
        scoringEvidence: t.scoringEvidence,
      })),
    },
    harnessComparison: report.harnessAggregation.map((h) => ({
      harness: h.harness,
      avgLift: h.avgLift,
      dimensions: h.dimensionLifts.map((l) => ({
        dimension: l.dimension,
        lift: l.absoluteLift,
        liftPercent: l.percentageLift,
      })),
    })),
    tamperedComparisons: report.tamperedComparisons.map((t) => ({
      comparisonId: t.comparisonId,
      harness: t.harness,
      tamperLog: t.tamperLog,
    })),
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Parses a JSON report string back into its structured form.
 * Returns the raw parsed object for validation or re-processing.
 */
export function parseJsonReport(json: string): ReturnType<typeof JSON.parse> {
  const parsed = JSON.parse(json);

  if (parsed.meta?.format !== 'jumbo-eval-report') {
    throw new Error('Invalid report format: missing or incorrect meta.format');
  }

  if (typeof parsed.meta?.version !== 'number') {
    throw new Error('Invalid report format: missing meta.version');
  }

  return parsed;
}
