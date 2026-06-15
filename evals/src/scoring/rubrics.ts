/**
 * Locked scoring rubrics for LLM-as-judge evaluation.
 *
 * Each rubric defines a qualitative dimension with:
 * - Specific evaluation questions
 * - A fixed scoring scale (1-5)
 * - Evidence anchoring requirements (judge must cite transcript/file evidence)
 *
 * Rubrics are immutable — changes require a new version, not in-place mutation.
 */

export interface RubricQuestion {
  readonly id: string;
  readonly question: string;
  readonly scoringScale: readonly ScalePoint[];
}

export interface ScalePoint {
  readonly score: number;
  readonly label: string;
  readonly description: string;
}

export interface Rubric {
  readonly dimension: string;
  readonly version: number;
  readonly description: string;
  readonly systemPrompt: string;
  readonly questions: readonly RubricQuestion[];
}

const FIVE_POINT_SCALE: readonly ScalePoint[] = [
  { score: 1, label: 'None', description: 'No evidence of this quality' },
  { score: 2, label: 'Minimal', description: 'Sparse or inconsistent evidence' },
  { score: 3, label: 'Moderate', description: 'Present but with notable gaps' },
  { score: 4, label: 'Strong', description: 'Consistent with minor gaps' },
  { score: 5, label: 'Excellent', description: 'Thorough and consistent throughout' },
];

export const CONSISTENCY_RUBRIC: Rubric = {
  dimension: 'consistency',
  version: 1,
  description: 'Evaluates whether patterns, conventions, and decisions established in early sessions persist through later sessions.',
  systemPrompt: [
    'You are an expert software engineering evaluator.',
    'You are reviewing transcripts from a multi-session coding project.',
    'Your task is to evaluate CONSISTENCY: whether patterns established early in the project are maintained in later sessions.',
    'You MUST cite specific evidence from the transcripts for every score.',
    'For each question, provide: a score (1-5), and evidence (exact quotes or file references from the transcripts).',
    'Respond in valid JSON format.',
  ].join(' '),
  questions: [
    {
      id: 'naming-conventions',
      question: 'Are naming conventions (variable names, file names, function names) established in early sessions consistently followed in later sessions?',
      scoringScale: FIVE_POINT_SCALE,
    },
    {
      id: 'architectural-patterns',
      question: 'Are architectural patterns (module structure, import patterns, abstraction layers) introduced early maintained throughout later sessions?',
      scoringScale: FIVE_POINT_SCALE,
    },
    {
      id: 'style-coherence',
      question: 'Does the code style (formatting, error handling approach, logging patterns) remain coherent across sessions, or does it drift as if written by different authors?',
      scoringScale: FIVE_POINT_SCALE,
    },
  ],
};

export const ERROR_CORRECTION_RUBRIC: Rubric = {
  dimension: 'error-correction',
  version: 1,
  description: 'Evaluates whether mistakes and corrections are properly handled — errors caught, fixed, and not reintroduced in subsequent sessions.',
  systemPrompt: [
    'You are an expert software engineering evaluator.',
    'You are reviewing transcripts from a multi-session coding project.',
    'Your task is to evaluate ERROR CORRECTION: whether mistakes are caught, fixed properly, and not reintroduced.',
    'You MUST cite specific evidence from the transcripts for every score.',
    'For each question, provide: a score (1-5), and evidence (exact quotes or file references from the transcripts).',
    'Respond in valid JSON format.',
  ].join(' '),
  questions: [
    {
      id: 'error-detection',
      question: 'When errors or bugs are introduced, are they detected and acknowledged in the same or subsequent session?',
      scoringScale: FIVE_POINT_SCALE,
    },
    {
      id: 'fix-persistence',
      question: 'Once a bug is fixed or a correction is applied, does the fix persist in later sessions, or is the same error reintroduced?',
      scoringScale: FIVE_POINT_SCALE,
    },
    {
      id: 'correction-integration',
      question: 'When mid-project corrections are given (scope changes, new constraints), are they integrated thoroughly or only partially applied?',
      scoringScale: FIVE_POINT_SCALE,
    },
  ],
};

export const ARCHITECTURAL_QUALITY_RUBRIC: Rubric = {
  dimension: 'architectural-quality',
  version: 1,
  description: 'Evaluates the overall architectural quality of the produced code across sessions — separation of concerns, dependency management, and design coherence.',
  systemPrompt: [
    'You are an expert software engineering evaluator.',
    'You are reviewing transcripts from a multi-session coding project.',
    'Your task is to evaluate ARCHITECTURAL QUALITY: the design coherence and structural quality of the code produced.',
    'You MUST cite specific evidence from the transcripts for every score.',
    'For each question, provide: a score (1-5), and evidence (exact quotes or file references from the transcripts).',
    'Respond in valid JSON format.',
  ].join(' '),
  questions: [
    {
      id: 'separation-of-concerns',
      question: 'Does the code maintain clear separation of concerns across modules, or do responsibilities bleed across boundaries over sessions?',
      scoringScale: FIVE_POINT_SCALE,
    },
    {
      id: 'dependency-direction',
      question: 'Do dependencies flow in a consistent direction (e.g., domain does not depend on infrastructure), or do circular or inverted dependencies appear in later sessions?',
      scoringScale: FIVE_POINT_SCALE,
    },
    {
      id: 'design-evolution',
      question: 'As the project evolves across sessions, does the architecture adapt coherently (refactoring when needed), or does it accumulate ad-hoc patches?',
      scoringScale: FIVE_POINT_SCALE,
    },
  ],
};

export const ALL_RUBRICS: readonly Rubric[] = [
  CONSISTENCY_RUBRIC,
  ERROR_CORRECTION_RUBRIC,
  ARCHITECTURAL_QUALITY_RUBRIC,
];

/**
 * Builds the judge prompt for a given rubric and session transcripts.
 * The prompt includes the rubric questions, scoring scale, and the transcripts
 * to evaluate. The expected response format is enforced via the prompt.
 */
export function buildJudgePrompt(
  rubric: Rubric,
  transcripts: readonly string[],
): string {
  const scaleDescription = rubric.questions[0].scoringScale
    .map((sp) => `  ${sp.score} - ${sp.label}: ${sp.description}`)
    .join('\n');

  const questionsBlock = rubric.questions
    .map((q, i) => `Question ${i + 1} (id: "${q.id}"): ${q.question}`)
    .join('\n\n');

  const transcriptsBlock = transcripts
    .map((t, i) => `=== Session ${i + 1} Transcript ===\n${t}`)
    .join('\n\n');

  return [
    `Evaluate the following multi-session project transcripts for: ${rubric.description}`,
    '',
    '## Scoring Scale',
    scaleDescription,
    '',
    '## Questions',
    questionsBlock,
    '',
    '## Transcripts',
    transcriptsBlock,
    '',
    '## Required Response Format',
    'Respond with a JSON object matching this structure exactly:',
    '```json',
    '{',
    '  "scores": [',
    '    {',
    `      "questionId": "${rubric.questions[0].id}",`,
    '      "score": <1-5>,',
    '      "evidence": "<exact quote or file reference from transcripts>"',
    '    }',
    '  ]',
    '}',
    '```',
    `You MUST provide a score entry for each of the ${rubric.questions.length} questions.`,
    'You MUST include specific evidence (exact quotes or file references) for every score. A score without evidence is invalid.',
  ].join('\n');
}
