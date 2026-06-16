import type { DimensionScore, JumboLifecycleAudit, SessionRecord } from '../domain/types.js';

const DIMENSION = 'protocol-adherence';

export type ProtocolStep =
  | 'session-start'
  | 'goal-start'
  | 'in-session-captures'
  | 'progress-updates'
  | 'goal-submit'
  | 'session-end';

export const PROTOCOL_STEPS: readonly ProtocolStep[] = [
  'session-start',
  'goal-start',
  'in-session-captures',
  'progress-updates',
  'goal-submit',
  'session-end',
] as const;

export interface ProtocolStepResult {
  readonly step: ProtocolStep;
  readonly passed: boolean;
}

export interface SessionAdherence {
  readonly sessionNumber: number;
  readonly steps: readonly ProtocolStepResult[];
  readonly score: number;
}

function stepResultsForAudit(audit: JumboLifecycleAudit): ProtocolStepResult[] {
  return [
    { step: 'session-start', passed: audit.sessionStartExecuted },
    { step: 'goal-start', passed: audit.goalStartExecuted },
    { step: 'in-session-captures', passed: audit.inSessionCapturesExecuted },
    { step: 'progress-updates', passed: audit.progressUpdatesExecuted },
    { step: 'goal-submit', passed: audit.goalSubmitExecuted },
    { step: 'session-end', passed: audit.sessionEndExecuted },
  ];
}

/**
 * Per-session protocol adherence. Each step is a boolean derived from the
 * session's JumboLifecycleAudit (Jumbo's own state, not transcript parsing).
 * Aggregate session score = passed steps / total steps. Sessions without an
 * audit (e.g. baseline sessions) yield an empty step list and score 0.
 */
export function adherenceForSession(record: SessionRecord): SessionAdherence {
  const audit = record.jumboLifecycleAudit;
  if (!audit) {
    return { sessionNumber: record.sessionNumber, steps: [], score: 0 };
  }
  const steps = stepResultsForAudit(audit);
  const passed = steps.filter((s) => s.passed).length;
  return {
    sessionNumber: record.sessionNumber,
    steps,
    score: steps.length === 0 ? 0 : passed / steps.length,
  };
}

function summarizeFailures(adherences: readonly SessionAdherence[]): string {
  const failureCounts = new Map<ProtocolStep, number[]>();
  for (const adherence of adherences) {
    for (const step of adherence.steps) {
      if (step.passed) continue;
      const sessions = failureCounts.get(step.step) ?? [];
      sessions.push(adherence.sessionNumber);
      failureCounts.set(step.step, sessions);
    }
  }
  if (failureCounts.size === 0) return 'all-steps-passed';
  return [...failureCounts.entries()]
    .map(([step, sessions]) => `${step}-missed-in-sessions:${sessions.join(',')}`)
    .join('; ');
}

/**
 * Aggregate protocol adherence across all sessions in the Jumbo arm. Score is
 * the mean of per-session scores. Surfaces protocol-failure modes (which
 * steps were skipped, in which sessions) in `details` so non-adherence is
 * first-class signal — not noise to suppress.
 */
export function scoreProtocolAdherence(records: readonly SessionRecord[]): DimensionScore {
  const audited = records.filter((r) => r.jumboLifecycleAudit !== undefined);
  if (audited.length === 0) {
    return {
      dimension: DIMENSION,
      score: 0,
      maxScore: 1,
      details: 'No lifecycle audits recorded; protocol adherence cannot be measured.',
    };
  }
  const adherences = audited.map(adherenceForSession);
  const meanScore = adherences.reduce((sum, a) => sum + a.score, 0) / adherences.length;
  const totalSteps = adherences.reduce((sum, a) => sum + a.steps.length, 0);
  const passedSteps = adherences.reduce(
    (sum, a) => sum + a.steps.filter((s) => s.passed).length,
    0,
  );

  return {
    dimension: DIMENSION,
    score: Math.round(meanScore * 100) / 100,
    maxScore: 1,
    details: [
      `sessions-audited=${audited.length}`,
      `steps-passed=${passedSteps}/${totalSteps}`,
      summarizeFailures(adherences),
    ].join('; '),
  };
}

export function baselineProtocolAdherenceScore(): DimensionScore {
  return {
    dimension: DIMENSION,
    score: 0,
    maxScore: 0,
    details: 'Not applicable: baseline runs do not execute the Jumbo lifecycle protocol.',
  };
}

export function scoreProtocolAdherenceTimeline(
  records: readonly SessionRecord[],
): DimensionScore[] {
  return records.map((record) => {
    const adherence = adherenceForSession(record);
    if (adherence.steps.length === 0) {
      return {
        dimension: DIMENSION,
        score: 0,
        maxScore: 1,
        details: 'No lifecycle audit for this session.',
      };
    }
    const passed = adherence.steps.filter((s) => s.passed).map((s) => s.step);
    const failed = adherence.steps.filter((s) => !s.passed).map((s) => s.step);
    return {
      dimension: DIMENSION,
      score: Math.round(adherence.score * 100) / 100,
      maxScore: 1,
      details: [
        `passed: ${passed.length > 0 ? passed.join(',') : 'none'}`,
        `failed: ${failed.length > 0 ? failed.join(',') : 'none'}`,
      ].join('; '),
    };
  });
}
