import { describe, it, expect } from '@jest/globals';
import { createSessionRecord } from '../../src/domain/types.js';
import {
  scoreWithJudge,
  scoreAllJudgeDimensions,
  validateJudgeConfig,
  parseJudgeResponse,
} from '../../src/scoring/llm-judge-scorer.js';
import type { JudgeConfig, JudgeFn } from '../../src/scoring/llm-judge-scorer.js';
import {
  CONSISTENCY_RUBRIC,
  ERROR_CORRECTION_RUBRIC,
  ARCHITECTURAL_QUALITY_RUBRIC,
  ALL_RUBRICS,
  buildJudgePrompt,
} from '../../src/scoring/rubrics.js';

function makeRecords(count: number): ReturnType<typeof createSessionRecord>[] {
  return Array.from({ length: count }, (_, i) =>
    createSessionRecord({
      id: `rec-${i + 1}`,
      scenarioId: 'scenario-1',
      sessionNumber: i + 1,
      harness: 'claude-code',
      agentOutput: `Session ${i + 1} output: implemented feature ${i + 1}`,
      filesModified: [`src/feature-${i + 1}.ts`],
      transcript: `User: Continue the project.\nAgent: I'll work on feature ${i + 1}. Creating src/feature-${i + 1}.ts with the naming convention from session 1.`,
      startedAt: '2026-03-21T10:00:00Z',
      completedAt: '2026-03-21T10:05:00Z',
    }),
  );
}

function makeMockJudgeResponse(rubricDimension: string): string {
  const questionIds: Record<string, string[]> = {
    consistency: ['naming-conventions', 'architectural-patterns', 'style-coherence'],
    'error-correction': ['error-detection', 'fix-persistence', 'correction-integration'],
    'architectural-quality': ['separation-of-concerns', 'dependency-direction', 'design-evolution'],
  };

  const ids = questionIds[rubricDimension] ?? [];
  const scores = ids.map((id) => ({
    questionId: id,
    score: 4,
    evidence: `Evidence for ${id}: consistent pattern observed in transcript`,
  }));

  return JSON.stringify({ scores });
}

const validConfig: JudgeConfig = {
  judgeModel: 'gpt-4o',
  runnerModel: 'claude-sonnet-4-6',
};

const mockJudgeFn: JudgeFn = async (_system, _user, _model) => {
  // Default mock — overridden per-test where needed
  return makeMockJudgeResponse('consistency');
};

describe('validateJudgeConfig', () => {
  it('passes when judge and runner models differ', () => {
    expect(() => validateJudgeConfig(validConfig)).not.toThrow();
  });

  it('throws when judge and runner models match', () => {
    expect(() =>
      validateJudgeConfig({ judgeModel: 'claude-sonnet-4-6', runnerModel: 'claude-sonnet-4-6' }),
    ).toThrow('must differ from runner model');
  });

  it('throws when judge model is empty', () => {
    expect(() =>
      validateJudgeConfig({ judgeModel: '', runnerModel: 'claude-sonnet-4-6' }),
    ).toThrow('Judge model must be specified');
  });

  it('throws when runner model is empty', () => {
    expect(() =>
      validateJudgeConfig({ judgeModel: 'gpt-4o', runnerModel: '' }),
    ).toThrow('Runner model must be specified');
  });
});

describe('parseJudgeResponse', () => {
  it('parses valid JSON response', () => {
    const raw = makeMockJudgeResponse('consistency');
    const result = parseJudgeResponse(raw, CONSISTENCY_RUBRIC);

    expect(result.scores).toHaveLength(3);
    expect(result.scores[0].questionId).toBe('naming-conventions');
    expect(result.scores[0].score).toBe(4);
    expect(result.scores[0].evidence).toContain('Evidence for naming-conventions');
  });

  it('handles markdown code fences', () => {
    const raw = '```json\n' + makeMockJudgeResponse('consistency') + '\n```';
    const result = parseJudgeResponse(raw, CONSISTENCY_RUBRIC);

    expect(result.scores).toHaveLength(3);
  });

  it('throws on invalid JSON', () => {
    expect(() => parseJudgeResponse('not json', CONSISTENCY_RUBRIC)).toThrow('not valid JSON');
  });

  it('throws on missing scores array', () => {
    expect(() => parseJudgeResponse('{}', CONSISTENCY_RUBRIC)).toThrow('missing "scores" array');
  });

  it('throws on invalid score value', () => {
    const raw = JSON.stringify({
      scores: [
        { questionId: 'naming-conventions', score: 6, evidence: 'test' },
        { questionId: 'architectural-patterns', score: 4, evidence: 'test' },
        { questionId: 'style-coherence', score: 4, evidence: 'test' },
      ],
    });
    expect(() => parseJudgeResponse(raw, CONSISTENCY_RUBRIC)).toThrow('Invalid score');
  });

  it('throws on missing evidence', () => {
    const raw = JSON.stringify({
      scores: [
        { questionId: 'naming-conventions', score: 4, evidence: '' },
        { questionId: 'architectural-patterns', score: 4, evidence: 'test' },
        { questionId: 'style-coherence', score: 4, evidence: 'test' },
      ],
    });
    expect(() => parseJudgeResponse(raw, CONSISTENCY_RUBRIC)).toThrow('Missing evidence');
  });

  it('throws on unexpected questionId', () => {
    const raw = JSON.stringify({
      scores: [
        { questionId: 'bogus-id', score: 4, evidence: 'test' },
      ],
    });
    expect(() => parseJudgeResponse(raw, CONSISTENCY_RUBRIC)).toThrow('Unexpected or missing questionId');
  });

  it('throws on wrong number of scores', () => {
    const raw = JSON.stringify({
      scores: [
        { questionId: 'naming-conventions', score: 4, evidence: 'test' },
      ],
    });
    expect(() => parseJudgeResponse(raw, CONSISTENCY_RUBRIC)).toThrow('Expected 3 scores, got 1');
  });
});

describe('scoreWithJudge', () => {
  it('returns normalized score from judge response', async () => {
    const records = makeRecords(3);
    const judgeFn: JudgeFn = async () => makeMockJudgeResponse('consistency');

    const result = await scoreWithJudge(records, CONSISTENCY_RUBRIC, validConfig, judgeFn);

    expect(result.dimension).toBe('consistency');
    // All scores are 4/5, so average = 12/15 = 0.8
    expect(result.score).toBe(0.8);
    expect(result.maxScore).toBe(1);
    expect(result.details).toContain('naming-conventions=4/5');
    expect(result.details).toContain('Evidence for naming-conventions');
  });

  it('returns zero score for empty session records', async () => {
    const result = await scoreWithJudge([], CONSISTENCY_RUBRIC, validConfig, mockJudgeFn);

    expect(result.score).toBe(0);
    expect(result.details).toContain('No session records');
  });

  it('passes correct model to judge function', async () => {
    const records = makeRecords(2);
    let capturedModel = '';
    const judgeFn: JudgeFn = async (_sys, _user, model) => {
      capturedModel = model;
      return makeMockJudgeResponse('consistency');
    };

    await scoreWithJudge(records, CONSISTENCY_RUBRIC, validConfig, judgeFn);
    expect(capturedModel).toBe('gpt-4o');
  });

  it('passes system prompt from rubric to judge function', async () => {
    const records = makeRecords(2);
    let capturedSystem = '';
    const judgeFn: JudgeFn = async (sys, _user, _model) => {
      capturedSystem = sys;
      return makeMockJudgeResponse('consistency');
    };

    await scoreWithJudge(records, CONSISTENCY_RUBRIC, validConfig, judgeFn);
    expect(capturedSystem).toBe(CONSISTENCY_RUBRIC.systemPrompt);
  });

  it('throws when judge and runner model match', async () => {
    const records = makeRecords(2);
    const badConfig: JudgeConfig = { judgeModel: 'same-model', runnerModel: 'same-model' };

    await expect(
      scoreWithJudge(records, CONSISTENCY_RUBRIC, badConfig, mockJudgeFn),
    ).rejects.toThrow('must differ from runner model');
  });
});

describe('scoreAllJudgeDimensions', () => {
  it('scores all three qualitative dimensions', async () => {
    const records = makeRecords(3);
    let callCount = 0;
    const judgeFn: JudgeFn = async (_sys, _user, _model) => {
      const dimensions = ['consistency', 'error-correction', 'architectural-quality'];
      return makeMockJudgeResponse(dimensions[callCount++]);
    };

    const scores = await scoreAllJudgeDimensions(records, validConfig, judgeFn);

    expect(scores).toHaveLength(3);
    expect(scores[0].dimension).toBe('consistency');
    expect(scores[1].dimension).toBe('error-correction');
    expect(scores[2].dimension).toBe('architectural-quality');
    expect(scores.every((s) => s.score === 0.8)).toBe(true);
  });

  it('accepts custom rubric subset', async () => {
    const records = makeRecords(2);
    const judgeFn: JudgeFn = async () => makeMockJudgeResponse('consistency');

    const scores = await scoreAllJudgeDimensions(
      records,
      validConfig,
      judgeFn,
      [CONSISTENCY_RUBRIC],
    );

    expect(scores).toHaveLength(1);
    expect(scores[0].dimension).toBe('consistency');
  });
});

describe('buildJudgePrompt', () => {
  it('includes rubric questions and transcripts', () => {
    const transcripts = ['Session 1 transcript', 'Session 2 transcript'];
    const prompt = buildJudgePrompt(CONSISTENCY_RUBRIC, transcripts);

    expect(prompt).toContain('naming conventions');
    expect(prompt).toContain('Session 1 Transcript');
    expect(prompt).toContain('Session 2 Transcript');
    expect(prompt).toContain('Session 1 transcript');
    expect(prompt).toContain('Session 2 transcript');
    expect(prompt).toContain('1 - None');
    expect(prompt).toContain('5 - Excellent');
  });

  it('includes response format instructions', () => {
    const prompt = buildJudgePrompt(ERROR_CORRECTION_RUBRIC, ['transcript']);

    expect(prompt).toContain('questionId');
    expect(prompt).toContain('evidence');
    expect(prompt).toContain('MUST include specific evidence');
  });
});

describe('rubrics', () => {
  it('ALL_RUBRICS contains exactly 3 rubrics', () => {
    expect(ALL_RUBRICS).toHaveLength(3);
  });

  it('each rubric has 3 questions with 5-point scales', () => {
    for (const rubric of ALL_RUBRICS) {
      expect(rubric.questions).toHaveLength(3);
      for (const q of rubric.questions) {
        expect(q.scoringScale).toHaveLength(5);
        expect(q.scoringScale[0].score).toBe(1);
        expect(q.scoringScale[4].score).toBe(5);
      }
    }
  });

  it('rubric dimensions are unique', () => {
    const dimensions = ALL_RUBRICS.map((r) => r.dimension);
    expect(new Set(dimensions).size).toBe(dimensions.length);
  });

  it('rubric question ids are unique within each rubric', () => {
    for (const rubric of ALL_RUBRICS) {
      const ids = rubric.questions.map((q) => q.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});
