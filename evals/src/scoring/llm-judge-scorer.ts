import type { SessionRecord, DimensionScore } from '../domain/types.js';
import type { Rubric } from './rubrics.js';
import { ALL_RUBRICS, buildJudgePrompt } from './rubrics.js';

/**
 * Response from a single rubric evaluation by the judge LLM.
 */
export interface JudgeQuestionScore {
  readonly questionId: string;
  readonly score: number;
  readonly evidence: string;
}

export interface JudgeResponse {
  readonly scores: readonly JudgeQuestionScore[];
}

/**
 * Configuration for the LLM judge.
 * The judgeModel MUST differ from runnerModel to avoid self-model bias.
 */
export interface JudgeConfig {
  readonly judgeModel: string;
  readonly runnerModel: string;
}

/**
 * The judge function type — injected dependency for I/O boundary.
 * Takes a system prompt, user prompt, and model identifier.
 * Returns the raw string response from the LLM.
 */
export type JudgeFn = (
  systemPrompt: string,
  userPrompt: string,
  model: string,
) => Promise<string>;

/**
 * Validates that the judge model differs from the runner model.
 * Throws if they match — self-model bias is not permitted.
 */
export function validateJudgeConfig(config: JudgeConfig): void {
  if (config.judgeModel === config.runnerModel) {
    throw new Error(
      `Judge model "${config.judgeModel}" must differ from runner model "${config.runnerModel}" to avoid self-model bias`,
    );
  }
  if (!config.judgeModel) {
    throw new Error('Judge model must be specified');
  }
  if (!config.runnerModel) {
    throw new Error('Runner model must be specified');
  }
}

/**
 * Parses the judge LLM response into structured scores.
 * Extracts JSON from the response, handling optional markdown code fences.
 */
export function parseJudgeResponse(raw: string, rubric: Rubric): JudgeResponse {
  // Strip markdown code fences if present
  let jsonStr = raw.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }

  let parsed: { scores?: unknown[] };
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error(`Judge response is not valid JSON: ${raw.slice(0, 200)}`);
  }

  if (!Array.isArray(parsed.scores)) {
    throw new Error('Judge response missing "scores" array');
  }

  const expectedIds = new Set(rubric.questions.map((q) => q.id));
  const scores: JudgeQuestionScore[] = [];

  for (const entry of parsed.scores) {
    const e = entry as Record<string, unknown>;

    if (typeof e.questionId !== 'string' || !expectedIds.has(e.questionId)) {
      throw new Error(`Unexpected or missing questionId: ${String(e.questionId)}`);
    }

    const score = Number(e.score);
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      throw new Error(`Invalid score for ${e.questionId}: ${String(e.score)} (must be 1-5)`);
    }

    if (typeof e.evidence !== 'string' || e.evidence.trim().length === 0) {
      throw new Error(`Missing evidence for ${e.questionId}`);
    }

    scores.push({
      questionId: e.questionId as string,
      score,
      evidence: e.evidence as string,
    });
  }

  if (scores.length !== rubric.questions.length) {
    throw new Error(
      `Expected ${rubric.questions.length} scores, got ${scores.length}`,
    );
  }

  return { scores };
}

/**
 * Scores a single rubric dimension against session transcripts.
 * Pure function — the judge LLM call is injected via judgeFn.
 *
 * Returns a DimensionScore with:
 * - score: average across all rubric questions (normalized to 0-1)
 * - maxScore: 1
 * - details: per-question scores and evidence
 */
export async function scoreWithJudge(
  sessionRecords: readonly SessionRecord[],
  rubric: Rubric,
  config: JudgeConfig,
  judgeFn: JudgeFn,
): Promise<DimensionScore> {
  validateJudgeConfig(config);

  if (sessionRecords.length === 0) {
    return {
      dimension: rubric.dimension,
      score: 0,
      maxScore: 1,
      details: 'No session records to evaluate',
    };
  }

  const transcripts = sessionRecords.map((r) => r.transcript);
  const userPrompt = buildJudgePrompt(rubric, transcripts);

  const rawResponse = await judgeFn(rubric.systemPrompt, userPrompt, config.judgeModel);
  const judgeResponse = parseJudgeResponse(rawResponse, rubric);

  // Average score across questions, normalized to 0-1
  const totalScore = judgeResponse.scores.reduce((sum, s) => sum + s.score, 0);
  const maxPossible = rubric.questions.length * 5;
  const normalizedScore = Math.round((totalScore / maxPossible) * 100) / 100;

  const evidenceDetails = judgeResponse.scores
    .map((s) => `${s.questionId}=${s.score}/5 [${s.evidence}]`)
    .join('; ');

  return {
    dimension: rubric.dimension,
    score: normalizedScore,
    maxScore: 1,
    details: evidenceDetails,
  };
}

/**
 * Scores all three qualitative dimensions using the LLM judge.
 * Returns one DimensionScore per rubric (consistency, error-correction, architectural-quality).
 */
export async function scoreAllJudgeDimensions(
  sessionRecords: readonly SessionRecord[],
  config: JudgeConfig,
  judgeFn: JudgeFn,
  rubrics: readonly Rubric[] = ALL_RUBRICS,
): Promise<DimensionScore[]> {
  validateJudgeConfig(config);

  const scores: DimensionScore[] = [];
  for (const rubric of rubrics) {
    const score = await scoreWithJudge(sessionRecords, rubric, config, judgeFn);
    scores.push(score);
  }

  return scores;
}
