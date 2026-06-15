export { createTestScenario, createSessionRecord, createTestResult, createComparisonResult } from './domain/index.js';
export type { DisruptionType, Disruption, JumboMemoryKind, ExpectedJumboMemoryCapture, JumboMemoryEntity, JumboMemoryCommandResult, JumboMemorySnapshot, TestScenario, SessionRecord, TestResult, DimensionScore, PerSessionScore, ComparisonResult } from './domain/index.js';

export { JsonResultStore } from './storage/index.js';
export type { ResultStore } from './storage/index.js';

export { LocalExecutor } from './infrastructure/index.js';
export type { ExecResult } from './infrastructure/index.js';

/** @deprecated Use LocalExecutor instead */
export { ContainerManager } from './infrastructure/index.js';
export type { ContainerConfig } from './infrastructure/index.js';

export { ClaudeCodeAdapter, CodexCliAdapter, GeminiCliAdapter } from './harness/index.js';
export type { HarnessAdapter } from './harness/index.js';

export { scoreFileAccuracy, scoreKnowledgeRetention, scoreKnowledgeRetentionTimeline, scoreDisruptionRecovery, scoreDisruptionRecoveryTimeline, scoreJumboMemoryCapture, scoreJumboMemoryCaptureTimeline, baselineJumboMemoryCaptureScore, scoreTokenEfficiency, compareTokenEfficiency, tokenUsageTimeline, scoreWithJudge, scoreAllJudgeDimensions, validateJudgeConfig, parseJudgeResponse, ALL_RUBRICS, CONSISTENCY_RUBRIC, ERROR_CORRECTION_RUBRIC, ARCHITECTURAL_QUALITY_RUBRIC, buildJudgePrompt } from './scoring/index.js';
export type { JudgeConfig, JudgeFn, JudgeResponse, JudgeQuestionScore, Rubric, RubricQuestion, ScalePoint } from './scoring/index.js';

export { runSession } from './run-session.js';
export { runABComparison } from './ab-runner.js';
export type { ABRunConfig } from './ab-runner.js';

export { formatComparisonOutput, formatCrossHarnessComparison, computeDivergenceCurve, computeLiftPercentages, detectDivergenceOnset, analyzeDisruptionImpact, aggregateHarnessLifts, extractMemoryCaptureEvidence, generateFullReport, formatFullReport, exportReportAsJson, parseJsonReport } from './output/index.js';
export type { DivergencePoint, LiftResult, DivergenceOnset, DisruptionImpact, HarnessLiftSummary, MemoryCaptureEvidence, FullReport } from './output/index.js';

export { createProgram } from './cli/index.js';
export { handleScenarioCreate, formatScenarioList, validateHarnesses, formatScoreOutput, filterReportByDimensions, filterComparisonsByHarness, formatStatusOutput } from './cli/commands/index.js';
