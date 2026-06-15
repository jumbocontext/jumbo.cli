import { describe, it, expect } from '@jest/globals';
import { exportReportAsJson, parseJsonReport } from '../../src/output/json-report.js';
import { generateFullReport } from '../../src/output/report-generator.js';
import { createComparisonResult, createTestResult, createSessionRecord } from '../../src/domain/types.js';

function makeReport() {
  const record = createSessionRecord({
    id: 'rec-1',
    scenarioId: 'scenario-1',
    sessionNumber: 1,
    harness: 'claude-code',
    agentOutput: 'output',
    filesModified: ['src/index.ts'],
    transcript: 'transcript',
    startedAt: '2026-03-21T10:00:00Z',
    completedAt: '2026-03-21T10:05:00Z',
  });

  const result = createTestResult({ id: 'r1', scenarioId: 'scenario-1', harness: 'claude-code', sessionRecords: [record] });

  const comp = createComparisonResult({
    id: 'comp-1',
    scenarioId: 'scenario-1',
    harness: 'claude-code',
    jumboResult: result,
    baselineResult: result,
    jumboScores: [{ dimension: 'file-accuracy', score: 0.9, maxScore: 1 }],
    baselineScores: [{ dimension: 'file-accuracy', score: 0.6, maxScore: 1 }],
    deltas: [{ dimension: 'file-accuracy', score: 0.3, maxScore: 1 }],
  });

  return generateFullReport([comp]);
}

describe('exportReportAsJson', () => {
  it('produces valid JSON with correct structure', () => {
    const report = makeReport();
    const json = exportReportAsJson(report);
    const parsed = JSON.parse(json);

    expect(parsed.meta.format).toBe('jumbo-eval-report');
    expect(parsed.meta.version).toBe(1);
    expect(parsed.meta.scenarioId).toBe('scenario-1');
  });

  it('includes lift data', () => {
    const report = makeReport();
    const json = exportReportAsJson(report);
    const parsed = JSON.parse(json);

    expect(parsed.lift.byDimension).toHaveLength(1);
    expect(parsed.lift.byDimension[0].dimension).toBe('file-accuracy');
    expect(parsed.lift.byDimension[0].absoluteLift).toBeCloseTo(0.3, 2);
  });

  it('includes divergence data', () => {
    const report = makeReport();
    const json = exportReportAsJson(report);
    const parsed = JSON.parse(json);

    expect(parsed.divergence).toBeDefined();
    expect(parsed.divergence.onsets).toBeDefined();
  });

  it('includes harness comparison data', () => {
    const report = makeReport();
    const json = exportReportAsJson(report);
    const parsed = JSON.parse(json);

    expect(parsed.harnessComparison).toHaveLength(1);
    expect(parsed.harnessComparison[0].harness).toBe('claude-code');
  });
});

describe('parseJsonReport', () => {
  it('round-trips through export and parse', () => {
    const report = makeReport();
    const json = exportReportAsJson(report);
    const parsed = parseJsonReport(json);

    expect(parsed.meta.format).toBe('jumbo-eval-report');
    expect(parsed.meta.version).toBe(1);
  });

  it('throws on invalid format', () => {
    expect(() => parseJsonReport('{}')).toThrow('Invalid report format');
  });

  it('throws on missing version', () => {
    const bad = JSON.stringify({ meta: { format: 'jumbo-eval-report' } });
    expect(() => parseJsonReport(bad)).toThrow('missing meta.version');
  });

  it('throws on invalid JSON', () => {
    expect(() => parseJsonReport('not json')).toThrow();
  });
});
