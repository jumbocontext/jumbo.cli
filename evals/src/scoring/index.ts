export { scoreFileAccuracy } from './file-accuracy-scorer.js';
export { scoreKnowledgeRetention, scoreKnowledgeRetentionTimeline } from './knowledge-retention-scorer.js';
export { scoreStructuralAssertions, scoreStructuralAssertionsTimeline } from './structural-assertion-scorer.js';
export { scoreDisruptionRecovery, scoreDisruptionRecoveryTimeline } from './disruption-recovery-scorer.js';
export { scoreJumboMemoryCapture, scoreJumboMemoryCaptureTimeline, baselineJumboMemoryCaptureScore } from './jumbo-memory-capture-scorer.js';
export { scoreProtocolAdherence, scoreProtocolAdherenceTimeline, baselineProtocolAdherenceScore, adherenceForSession, PROTOCOL_STEPS } from './protocol-adherence-scorer.js';
export type { ProtocolStep, ProtocolStepResult, SessionAdherence } from './protocol-adherence-scorer.js';
export { scoreTokenEfficiency, compareTokenEfficiency, tokenUsageTimeline } from './token-efficiency-scorer.js';
export { scoreWithJudge, scoreAllJudgeDimensions, validateJudgeConfig, parseJudgeResponse } from './llm-judge-scorer.js';
export type { JudgeConfig, JudgeFn, JudgeResponse, JudgeQuestionScore } from './llm-judge-scorer.js';
export { ALL_RUBRICS, CONSISTENCY_RUBRIC, ERROR_CORRECTION_RUBRIC, ARCHITECTURAL_QUALITY_RUBRIC, buildJudgePrompt } from './rubrics.js';
export type { Rubric, RubricQuestion, ScalePoint } from './rubrics.js';

import type { SessionRecord } from '../domain/types.js';

/**
 * Filters out tampered SessionRecords for aggregate scoring.
 * Aggregate dimension scores must remain attributable to Jumbo-delivered context,
 * not operator-injected tamper events. Per-record audit trails retain the full log.
 */
export function nonTamperedSessions(
  records: readonly SessionRecord[],
): readonly SessionRecord[] {
  return records.filter((r) => !r.tampered);
}
