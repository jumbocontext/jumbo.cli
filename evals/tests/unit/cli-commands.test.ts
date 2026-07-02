import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { createProgram } from '../../src/cli/index.js';
import type { ResultStore } from '../../src/storage/result-store.js';
import type { TestScenario, SessionRecord, TestResult, ComparisonResult, ReplicationReport } from '../../src/domain/types.js';
import { handleScenarioCreate } from '../../src/cli/commands/scenario-create.js';
import { formatScenarioList } from '../../src/cli/commands/scenario-list.js';
import { validateHarnesses } from '../../src/cli/commands/run.js';
import { formatScoreOutput } from '../../src/cli/commands/score.js';
import { filterReportByDimensions, filterComparisonsByHarness } from '../../src/cli/commands/report.js';
import { formatStatusOutput } from '../../src/cli/commands/status.js';
import { createTestScenario, createTestResult, createSessionRecord, createComparisonResult } from '../../src/domain/types.js';
import type { FullReport } from '../../src/output/report-generator.js';

describe('createProgram', () => {
  it('creates a commander program with eval name', () => {
    const program = createProgram();
    expect(program.name()).toBe('eval');
  });

  it('registers scenario subcommand', () => {
    const program = createProgram();
    const scenario = program.commands.find((c) => c.name() === 'scenario');
    expect(scenario).toBeDefined();
  });

  it('registers top-level commands', () => {
    const program = createProgram();
    const names = program.commands.map((c) => c.name());
    expect(names).toContain('scenario');
    expect(names).toContain('run');
    expect(names).toContain('score');
    expect(names).toContain('report');
    expect(names).toContain('status');
  });

  it('scenario has create and list subcommands', () => {
    const program = createProgram();
    const scenario = program.commands.find((c) => c.name() === 'scenario')!;
    const subNames = scenario.commands.map((c) => c.name());
    expect(subNames).toContain('create');
    expect(subNames).toContain('list');
  });
});

describe('handleScenarioCreate', () => {
  it('creates a scenario from template', () => {
    const scenario = handleScenarioCreate({
      name: 'Test Scenario',
      initialPrompt: 'Build a REST API',
      sessionCount: 3,
    });

    expect(scenario.name).toBe('Test Scenario');
    expect(scenario.initialPrompt).toBe('Build a REST API');
    expect(scenario.sessionCount).toBe(3);
    expect(scenario.id).toBeTruthy();
  });

  it('applies name override', () => {
    const scenario = handleScenarioCreate(
      { name: 'Original', initialPrompt: 'prompt', sessionCount: 2 },
      { name: 'Overridden' },
    );

    expect(scenario.name).toBe('Overridden');
  });

  it('applies session count override', () => {
    const scenario = handleScenarioCreate(
      { name: 'Test', initialPrompt: 'prompt', sessionCount: 2 },
      { sessions: 5 },
    );

    expect(scenario.sessionCount).toBe(5);
  });
});

class InMemoryStore implements ResultStore {
  scenarios: TestScenario[] = [];
  results: TestResult[] = [];
  async saveScenario(s: TestScenario): Promise<void> { this.scenarios.push(s); }
  async getScenario(id: string): Promise<TestScenario | null> {
    return this.scenarios.find((s) => s.id === id) ?? null;
  }
  async listScenarios(): Promise<TestScenario[]> { return [...this.scenarios]; }
  async saveSessionRecord(_r: SessionRecord): Promise<void> {}
  async getSessionRecords(_id: string): Promise<SessionRecord[]> { return []; }
  async saveTestResult(r: TestResult): Promise<void> {
    const existing = this.results.findIndex((candidate) => candidate.id === r.id);
    if (existing >= 0) {
      this.results[existing] = r;
    } else {
      this.results.push(r);
    }
  }
  async getTestResult(id: string): Promise<TestResult | null> {
    return this.results.find((r) => r.id === id) ?? null;
  }
  async listTestResults(scenarioId?: string): Promise<TestResult[]> {
    return scenarioId ? this.results.filter((r) => r.scenarioId === scenarioId) : [...this.results];
  }
  replicationReports = new Map<string, ReplicationReport>();
  async saveReplicationReport(runId: string, report: ReplicationReport): Promise<void> {
    this.replicationReports.set(runId, report);
  }
  async getReplicationReport(runId: string): Promise<ReplicationReport | null> {
    return this.replicationReports.get(runId) ?? null;
  }
}

describe('scenario create command', () => {
  let store: InMemoryStore;
  let tmpDir: string;
  let logSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(async () => {
    store = new InMemoryStore();
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'eval-cli-test-'));
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(async () => {
    logSpy.mockRestore();
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('persists scenario from template and prints UUID', async () => {
    const tplPath = path.join(tmpDir, 't.json');
    await fs.writeFile(tplPath, JSON.stringify({
      name: 'X', initialPrompt: 'Build', sessionCount: 4,
    }));

    const program = createProgram({ storeProvider: async () => store });
    await program.parseAsync(['node', 'eval', 'scenario', 'create', '--from-template', tplPath]);

    expect(store.scenarios).toHaveLength(1);
    expect(store.scenarios[0].name).toBe('X');
    expect(store.scenarios[0].sessionCount).toBe(4);
    const printed = logSpy.mock.calls.map((c) => String(c[0])).join('\n');
    expect(printed).toContain(store.scenarios[0].id);
    expect(printed.trim()).toBe(store.scenarios[0].id);
  });

  it('applies --name and --sessions overrides', async () => {
    const tplPath = path.join(tmpDir, 't.json');
    await fs.writeFile(tplPath, JSON.stringify({
      name: 'Original', initialPrompt: 'p', sessionCount: 2,
    }));

    const program = createProgram({ storeProvider: async () => store });
    await program.parseAsync([
      'node', 'eval', 'scenario', 'create',
      '--from-template', tplPath,
      '--name', 'Renamed',
      '--sessions', '7',
    ]);

    expect(store.scenarios[0].name).toBe('Renamed');
    expect(store.scenarios[0].sessionCount).toBe(7);
  });

  it('rejects unreadable template path with a clear error', async () => {
    const program = createProgram({ storeProvider: async () => store });
    await expect(program.parseAsync([
      'node', 'eval', 'scenario', 'create',
      '--from-template', path.join(tmpDir, 'does-not-exist.json'),
    ])).rejects.toThrow(/Cannot read template file/);
    expect(store.scenarios).toHaveLength(0);
  });

  it('rejects malformed JSON with a clear error', async () => {
    const tplPath = path.join(tmpDir, 'bad.json');
    await fs.writeFile(tplPath, '{ not json');

    const program = createProgram({ storeProvider: async () => store });
    await expect(program.parseAsync([
      'node', 'eval', 'scenario', 'create', '--from-template', tplPath,
    ])).rejects.toThrow(/not valid JSON/);
  });

  it('rejects template missing required fields', async () => {
    const tplPath = path.join(tmpDir, 'short.json');
    await fs.writeFile(tplPath, JSON.stringify({ name: 'X' }));

    const program = createProgram({ storeProvider: async () => store });
    await expect(program.parseAsync([
      'node', 'eval', 'scenario', 'create', '--from-template', tplPath,
    ])).rejects.toThrow(/initialPrompt|sessionCount/);
  });
});

describe('scenario list command', () => {
  let store: InMemoryStore;
  let logSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    store = new InMemoryStore();
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('prints empty-state message when no scenarios exist', async () => {
    const program = createProgram({ storeProvider: async () => store });
    await program.parseAsync(['node', 'eval', 'scenario', 'list']);
    const printed = logSpy.mock.calls.map((c) => String(c[0])).join('\n');
    expect(printed).toContain('No scenarios found');
  });

  it('prints registered scenarios in human format', async () => {
    store.scenarios.push({
      id: 'sid-1', name: 'My Scenario', initialPrompt: 'p',
      sessionCount: 3, createdAt: '2026-01-01T00:00:00Z',
    } as TestScenario);

    const program = createProgram({ storeProvider: async () => store });
    await program.parseAsync(['node', 'eval', 'scenario', 'list']);
    const printed = logSpy.mock.calls.map((c) => String(c[0])).join('\n');
    expect(printed).toContain('1 scenario(s)');
    expect(printed).toContain('sid-1');
    expect(printed).toContain('My Scenario');
  });

  it('--json emits parseable JSON of scenario array', async () => {
    store.scenarios.push({
      id: 'sid-2', name: 'JSON Scenario', initialPrompt: 'p',
      sessionCount: 2, createdAt: '2026-01-01T00:00:00Z',
    } as TestScenario);

    const program = createProgram({ storeProvider: async () => store });
    await program.parseAsync(['node', 'eval', 'scenario', 'list', '--json']);
    const printed = logSpy.mock.calls.map((c) => String(c[0])).join('\n');
    const parsed = JSON.parse(printed);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].id).toBe('sid-2');
  });
});

describe('formatScenarioList', () => {
  it('shows message for empty list', () => {
    const output = formatScenarioList([]);
    expect(output).toContain('No scenarios found');
  });

  it('formats scenarios with details', () => {
    const scenario = createTestScenario({
      id: 'test-id',
      name: 'My Scenario',
      initialPrompt: 'prompt',
      sessionCount: 3,
    });

    const output = formatScenarioList([scenario]);
    expect(output).toContain('1 scenario(s)');
    expect(output).toContain('My Scenario');
    expect(output).toContain('3');
  });
});

describe('validateHarnesses', () => {
  it('accepts valid harness names', () => {
    expect(validateHarnesses(['claude-code', 'codex-cli'])).toEqual(['claude-code', 'codex-cli']);
  });

  it('throws on invalid harness name', () => {
    expect(() => validateHarnesses(['claude-code', 'invalid-harness'])).toThrow('Unknown harness');
  });

  it('accepts all three harnesses', () => {
    expect(validateHarnesses(['claude-code', 'codex-cli', 'gemini-cli'])).toHaveLength(3);
  });
});

describe('formatScoreOutput', () => {
  it('formats scores for display', () => {
    const record = createSessionRecord({
      id: 'rec-1',
      scenarioId: 'scenario-1',
      sessionNumber: 1,
      harness: 'claude-code',
      agentOutput: 'output',
      filesModified: [],
      transcript: 'transcript',
      startedAt: '2026-03-21T10:00:00Z',
      completedAt: '2026-03-21T10:05:00Z',
    });

    const result = createTestResult({
      id: 'result-1',
      scenarioId: 'scenario-1',
      harness: 'claude-code',
      sessionRecords: [record],
    });

    const scores = [
      { dimension: 'file-accuracy', score: 0.9, maxScore: 1, details: '9/10 files' },
    ];

    const output = formatScoreOutput(result, scores);

    expect(output).toContain('result-1');
    expect(output).toContain('file-accuracy');
    expect(output).toContain('0.90/1.00');
    expect(output).toContain('9/10 files');
  });
});

describe('score command', () => {
  let store: InMemoryStore;
  let logSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    store = new InMemoryStore();
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  function seedScenario(): TestScenario {
    const scenario = createTestScenario({
      id: 'scenario-score',
      name: 'Score Scenario',
      initialPrompt: 'Build a typed config loader',
      sessionCount: 2,
      expectedFiles: ['src/config.ts'],
      retentionPatterns: ['typed config'],
      disruptions: [{
        type: 'correction',
        sessionNumber: 1,
        content: 'Use a typed config parser.',
        recoveryPatterns: ['typed config'],
      }],
      expectedJumboMemoryCaptures: [{
        kind: 'decision',
        match: 'typed config',
        sessionNumber: 1,
      }],
    });
    store.scenarios.push(scenario);
    return scenario;
  }

  function seedResult(params: {
    id: string;
    scenarioId: string;
    variant: 'jumbo' | 'baseline';
    output: string;
  }): TestResult {
    const records = [1, 2].map((sessionNumber) => createSessionRecord({
      id: `${params.id}-session-${sessionNumber}`,
      scenarioId: params.scenarioId,
      sessionNumber,
      harness: 'claude-code',
      variant: params.variant,
      agentOutput: params.output,
      filesModified: ['src/config.ts'],
      transcript: params.output,
      workspaceSnapshot: {
        capturedAt: '2026-03-21T10:05:00Z',
        files: [{
          path: 'src/config.ts',
          content: `export const note = "typed config ${params.output}";`,
        }],
      },
      jumboMemorySnapshot: params.variant === 'jumbo'
        ? {
            sessionNumber,
            capturedAt: '2026-03-21T10:05:00Z',
            entities: [{
              kind: 'decision',
              id: `decision-${sessionNumber}`,
              text: 'Chose typed config parser',
              raw: { title: 'Chose typed config parser' },
            }],
            commands: [],
          }
        : undefined,
      inputTokens: 100,
      outputTokens: 50,
      startedAt: '2026-03-21T10:00:00Z',
      completedAt: '2026-03-21T10:05:00Z',
    }));

    const result = createTestResult({
      id: params.id,
      scenarioId: params.scenarioId,
      harness: 'claude-code',
      sessionRecords: records,
    });
    store.results.push(result);
    return result;
  }

  it('scores a TestResult and prints all five deterministic dimensions', async () => {
    const scenario = seedScenario();
    seedResult({
      id: 'jumbo-result',
      scenarioId: scenario.id,
      variant: 'jumbo',
      output: 'typed config complete',
    });

    const program = createProgram({ storeProvider: async () => store });
    await program.parseAsync(['node', 'eval', 'score', '--scenario', scenario.id]);

    const printed = logSpy.mock.calls.map((call) => String(call[0])).join('\n');
    expect(printed).toContain('jumbo-result');
    expect(printed).toContain('file-accuracy');
    expect(printed).toContain('knowledge-retention');
    expect(printed).toContain('disruption-recovery');
    expect(printed).toContain('token-efficiency');
    expect(printed).toContain('jumbo-memory-capture');
  });

  it('--result narrows scoring to a single result', async () => {
    const scenario = seedScenario();
    seedResult({
      id: 'jumbo-result',
      scenarioId: scenario.id,
      variant: 'jumbo',
      output: 'typed config complete',
    });
    seedResult({
      id: 'baseline-result',
      scenarioId: scenario.id,
      variant: 'baseline',
      output: 'typed config complete',
    });

    const program = createProgram({ storeProvider: async () => store });
    await program.parseAsync([
      'node', 'eval', 'score',
      '--scenario', scenario.id,
      '--result', 'baseline-result',
    ]);

    const printed = logSpy.mock.calls.map((call) => String(call[0])).join('\n');
    expect(printed).toContain('baseline-result');
    expect(printed).not.toContain('jumbo-result');
    expect(printed).toContain('jumbo-memory-capture');
    expect(printed).toContain('0.00/0.00 (N/A)');
  });

  it('errors clearly when the scenario is missing', async () => {
    const program = createProgram({ storeProvider: async () => store });

    await expect(program.parseAsync([
      'node', 'eval', 'score', '--scenario', 'missing-scenario',
    ])).rejects.toThrow(/Scenario not found: missing-scenario/);
  });
});

describe('filterReportByDimensions', () => {
  const mockReport: FullReport = {
    scenarioId: 'scenario-1',
    harnesses: ['claude-code'],
    divergenceCurve: [
      { sessionNumber: 1, dimension: 'file-accuracy', jumboScore: 0.9, baselineScore: 0.7, delta: 0.2 },
      { sessionNumber: 1, dimension: 'retention', jumboScore: 0.8, baselineScore: 0.5, delta: 0.3 },
    ],
    liftResults: [
      { dimension: 'file-accuracy', jumboScore: 0.9, baselineScore: 0.7, absoluteLift: 0.2, percentageLift: 28.6 },
      { dimension: 'retention', jumboScore: 0.8, baselineScore: 0.5, absoluteLift: 0.3, percentageLift: 60 },
    ],
    divergenceOnsets: [
      { dimension: 'file-accuracy', onsetSession: 2, threshold: 0.1, deltaAtOnset: 0.15 },
      { dimension: 'retention', onsetSession: 1, threshold: 0.1, deltaAtOnset: 0.3 },
    ],
    disruptionImpacts: [],
    memoryCaptureEvidence: [],
    harnessAggregation: [],
    auditTrails: [],
    tamperedComparisons: [],
    generatedAt: '2026-03-21T10:00:00Z',
  };

  it('returns full report when no filter', () => {
    const filtered = filterReportByDimensions(mockReport, []);
    expect(filtered.liftResults).toHaveLength(2);
  });

  it('filters by dimension', () => {
    const filtered = filterReportByDimensions(mockReport, ['file-accuracy']);
    expect(filtered.liftResults).toHaveLength(1);
    expect(filtered.liftResults[0].dimension).toBe('file-accuracy');
    expect(filtered.divergenceCurve).toHaveLength(1);
    expect(filtered.divergenceOnsets).toHaveLength(1);
  });
});

describe('filterComparisonsByHarness', () => {
  it('returns all when no filter', () => {
    const record = createSessionRecord({
      id: 'r', scenarioId: 's', sessionNumber: 1, harness: 'claude-code',
      agentOutput: '', filesModified: [], transcript: '',
      startedAt: '2026-03-21T10:00:00Z', completedAt: '2026-03-21T10:05:00Z',
    });
    const result = createTestResult({ id: 'tr', scenarioId: 's', harness: 'claude-code', sessionRecords: [record] });
    const comp = createComparisonResult({
      id: 'c', scenarioId: 's', harness: 'claude-code',
      jumboResult: result, baselineResult: result,
      jumboScores: [], baselineScores: [], deltas: [],
    });

    expect(filterComparisonsByHarness([comp], [])).toHaveLength(1);
  });

  it('filters by harness', () => {
    const record = createSessionRecord({
      id: 'r', scenarioId: 's', sessionNumber: 1, harness: 'claude-code',
      agentOutput: '', filesModified: [], transcript: '',
      startedAt: '2026-03-21T10:00:00Z', completedAt: '2026-03-21T10:05:00Z',
    });
    const result = createTestResult({ id: 'tr', scenarioId: 's', harness: 'claude-code', sessionRecords: [record] });
    const comp1 = createComparisonResult({
      id: 'c1', scenarioId: 's', harness: 'claude-code',
      jumboResult: result, baselineResult: result,
      jumboScores: [], baselineScores: [], deltas: [],
    });
    const comp2 = createComparisonResult({
      id: 'c2', scenarioId: 's', harness: 'codex-cli',
      jumboResult: result, baselineResult: result,
      jumboScores: [], baselineScores: [], deltas: [],
    });

    const filtered = filterComparisonsByHarness([comp1, comp2], ['claude-code']);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].harness).toBe('claude-code');
  });
});

describe('report command', () => {
  let store: InMemoryStore;
  let logSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    store = new InMemoryStore();
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  function seedScenario(id = 'scenario-report'): TestScenario {
    const scenario = createTestScenario({
      id,
      name: 'Report Scenario',
      initialPrompt: 'Build a reportable feature',
      sessionCount: 2,
    });
    store.scenarios.push(scenario);
    return scenario;
  }

  function makeComparison(scenarioId: string, harness: string, lift: number): ComparisonResult {
    const jumboRecord = createSessionRecord({
      id: `${harness}-jumbo-rec`,
      scenarioId,
      sessionNumber: 1,
      harness,
      variant: 'jumbo',
      agentOutput: 'kept context',
      filesModified: ['src/report.ts'],
      transcript: 'kept context',
      startedAt: '2026-03-21T10:00:00Z',
      completedAt: '2026-03-21T10:05:00Z',
    });
    const baselineRecord = createSessionRecord({
      id: `${harness}-baseline-rec`,
      scenarioId,
      sessionNumber: 1,
      harness,
      variant: 'baseline',
      agentOutput: 'lost context',
      filesModified: ['src/report.ts'],
      transcript: 'lost context',
      startedAt: '2026-03-21T10:00:00Z',
      completedAt: '2026-03-21T10:05:00Z',
    });
    const jumboResult = createTestResult({
      id: `${harness}-jumbo`,
      scenarioId,
      harness,
      sessionRecords: [jumboRecord],
    });
    const baselineResult = createTestResult({
      id: `${harness}-baseline`,
      scenarioId,
      harness,
      sessionRecords: [baselineRecord],
    });
    return createComparisonResult({
      id: `${harness}-comparison`,
      scenarioId,
      harness,
      jumboResult,
      baselineResult,
      jumboScores: [
        { dimension: 'file-accuracy', score: 0.7 + lift, maxScore: 1 },
        { dimension: 'knowledge-retention', score: 0.6 + lift, maxScore: 1 },
      ],
      baselineScores: [
        { dimension: 'file-accuracy', score: 0.7, maxScore: 1 },
        { dimension: 'knowledge-retention', score: 0.6, maxScore: 1 },
      ],
      deltas: [
        { dimension: 'file-accuracy', score: lift, maxScore: 1 },
        { dimension: 'knowledge-retention', score: lift, maxScore: 1 },
      ],
      jumboTimeline: [{
        sessionNumber: 1,
        scores: [
          { dimension: 'file-accuracy', score: 0.7 + lift, maxScore: 1 },
          { dimension: 'knowledge-retention', score: 0.6 + lift, maxScore: 1 },
        ],
      }],
      baselineTimeline: [{
        sessionNumber: 1,
        scores: [
          { dimension: 'file-accuracy', score: 0.7, maxScore: 1 },
          { dimension: 'knowledge-retention', score: 0.6, maxScore: 1 },
        ],
      }],
    });
  }

  function seedComparison(comparison: ComparisonResult): void {
    store.results.push({
      ...comparison.jumboResult,
      comparisonResult: comparison,
    } as TestResult);
    store.results.push({
      ...comparison.baselineResult,
      comparisonResult: comparison,
    } as TestResult);
  }

  it('prints empty-state message when the scenario has no comparisons', async () => {
    const program = createProgram({ storeProvider: async () => store });

    await program.parseAsync(['node', 'eval', 'report', '--scenario', 'missing-scenario']);

    const printed = logSpy.mock.calls.map((call) => String(call[0])).join('\n');
    expect(printed).toContain('No comparisons found for scenario: missing-scenario');
  });

  it('--harness narrows the terminal report to matching comparisons', async () => {
    const scenario = seedScenario();
    seedComparison(makeComparison(scenario.id, 'claude-code', 0.2));
    seedComparison(makeComparison(scenario.id, 'codex-cli', 0.4));

    const program = createProgram({ storeProvider: async () => store });
    await program.parseAsync([
      'node', 'eval', 'report',
      '--scenario', scenario.id,
      '--harness', 'claude-code',
    ]);

    const printed = logSpy.mock.calls.map((call) => String(call[0])).join('\n');
    expect(printed).toContain('claude-code');
    expect(printed).not.toContain('codex-cli');
  });

  it('--dimension narrows the JSON report to matching dimensions', async () => {
    const scenario = seedScenario();
    seedComparison(makeComparison(scenario.id, 'claude-code', 0.2));

    const program = createProgram({ storeProvider: async () => store });
    await program.parseAsync([
      'node', 'eval', 'report',
      '--scenario', scenario.id,
      '--dimension', 'file-accuracy',
      '--json',
    ]);

    const printed = logSpy.mock.calls.map((call) => String(call[0])).join('\n');
    const parsed = JSON.parse(printed);
    expect(parsed.lift.byDimension).toHaveLength(1);
    expect(parsed.lift.byDimension[0].dimension).toBe('file-accuracy');
    expect(parsed.audit.trails[0].scoringEvidence).toHaveLength(1);
    expect(parsed.audit.trails[0].scoringEvidence[0].dimension).toBe('file-accuracy');
  });

  it('--json emits a parseable v1 jumbo-eval-report envelope', async () => {
    const scenario = seedScenario();
    seedComparison(makeComparison(scenario.id, 'claude-code', 0.2));

    const program = createProgram({ storeProvider: async () => store });
    await program.parseAsync(['node', 'eval', 'report', '--scenario', scenario.id, '--json']);

    const printed = logSpy.mock.calls.map((call) => String(call[0])).join('\n');
    const parsed = JSON.parse(printed);
    expect(parsed.meta.format).toBe('jumbo-eval-report');
    expect(parsed.meta.version).toBe(1);
    expect(parsed.meta.scenarioId).toBe(scenario.id);
  });

  it('rejects invalid filters before opening the store', async () => {
    const storeProvider = jest.fn(async () => store);
    const program = createProgram({ storeProvider });

    await expect(program.parseAsync([
      'node', 'eval', 'report',
      '--scenario', 'scenario-report',
      '--harness', 'bogus-harness',
    ])).rejects.toThrow(/Unknown harness/);

    expect(storeProvider).not.toHaveBeenCalled();

    await expect(program.parseAsync([
      'node', 'eval', 'report',
      '--scenario', 'scenario-report',
      '--dimension', 'bogus-dimension',
    ])).rejects.toThrow(/Unknown dimension/);

    expect(storeProvider).not.toHaveBeenCalled();
  });
});

describe('status command', () => {
  let store: InMemoryStore;
  let logSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    store = new InMemoryStore();
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  function seedResult(scenarioId: string, id: string): TestResult {
    const record = createSessionRecord({
      id: `${id}-rec`, scenarioId, sessionNumber: 1, harness: 'claude-code',
      agentOutput: '', filesModified: [], transcript: '',
      startedAt: '2026-03-21T10:00:00Z', completedAt: '2026-03-21T10:05:00Z',
    });
    return createTestResult({ id, scenarioId, harness: 'claude-code', sessionRecords: [record] });
  }

  it('prints empty-state message when store has no results', async () => {
    const program = createProgram({ storeProvider: async () => store });
    await program.parseAsync(['node', 'eval', 'status']);
    const printed = logSpy.mock.calls.map((c) => String(c[0])).join('\n');
    expect(printed).toContain('No runs found');
  });

  it('prints result IDs from a populated store', async () => {
    store.results.push(seedResult('scenario-a', 'res-a-1'));
    store.results.push(seedResult('scenario-b', 'res-b-1'));

    const program = createProgram({ storeProvider: async () => store });
    await program.parseAsync(['node', 'eval', 'status']);
    const printed = logSpy.mock.calls.map((c) => String(c[0])).join('\n');
    expect(printed).toContain('res-a-1');
    expect(printed).toContain('res-b-1');
    expect(printed).toContain('2 test result(s)');
  });

  it('--scenario narrows output to matching results', async () => {
    store.results.push(seedResult('scenario-a', 'res-a-1'));
    store.results.push(seedResult('scenario-b', 'res-b-1'));

    const program = createProgram({ storeProvider: async () => store });
    await program.parseAsync(['node', 'eval', 'status', '--scenario', 'scenario-a']);
    const printed = logSpy.mock.calls.map((c) => String(c[0])).join('\n');
    expect(printed).toContain('res-a-1');
    expect(printed).not.toContain('res-b-1');
  });

  it('--scenario with no matches prints empty-state message', async () => {
    store.results.push(seedResult('scenario-a', 'res-a-1'));

    const program = createProgram({ storeProvider: async () => store });
    await program.parseAsync(['node', 'eval', 'status', '--scenario', 'does-not-exist']);
    const printed = logSpy.mock.calls.map((c) => String(c[0])).join('\n');
    expect(printed).toContain('No runs found');
  });

  it('--json emits parseable JSON envelope with results and comparisons', async () => {
    store.results.push(seedResult('scenario-a', 'res-a-1'));

    const program = createProgram({ storeProvider: async () => store });
    await program.parseAsync(['node', 'eval', 'status', '--json']);
    const printed = logSpy.mock.calls.map((c) => String(c[0])).join('\n');
    const parsed = JSON.parse(printed);
    expect(Array.isArray(parsed.results)).toBe(true);
    expect(Array.isArray(parsed.comparisons)).toBe(true);
    expect(parsed.results[0].id).toBe('res-a-1');
  });
});

describe('formatStatusOutput', () => {
  it('shows message for empty results', () => {
    const output = formatStatusOutput([]);
    expect(output).toContain('No runs found');
  });

  it('formats results with details', () => {
    const record = createSessionRecord({
      id: 'r', scenarioId: 'scenario-1', sessionNumber: 1, harness: 'claude-code',
      agentOutput: '', filesModified: [], transcript: '',
      startedAt: '2026-03-21T10:00:00Z', completedAt: '2026-03-21T10:05:00Z',
    });
    const result = createTestResult({
      id: 'result-1', scenarioId: 'scenario-1', harness: 'claude-code',
      sessionRecords: [record],
    });

    const output = formatStatusOutput([result]);
    expect(output).toContain('1 test result(s)');
    expect(output).toContain('scenario-1');
    expect(output).toContain('result-1');
    expect(output).toContain('claude-code');
  });

  it('includes comparison summaries', () => {
    const record = createSessionRecord({
      id: 'r', scenarioId: 'scenario-1', sessionNumber: 1, harness: 'claude-code',
      agentOutput: '', filesModified: [], transcript: '',
      startedAt: '2026-03-21T10:00:00Z', completedAt: '2026-03-21T10:05:00Z',
    });
    const result = createTestResult({
      id: 'r1', scenarioId: 'scenario-1', harness: 'claude-code',
      sessionRecords: [record],
    });
    const comp = createComparisonResult({
      id: 'comp-1', scenarioId: 'scenario-1', harness: 'claude-code',
      jumboResult: result, baselineResult: result,
      jumboScores: [{ dimension: 'test', score: 0.9, maxScore: 1 }],
      baselineScores: [{ dimension: 'test', score: 0.6, maxScore: 1 }],
      deltas: [{ dimension: 'test', score: 0.3, maxScore: 1 }],
    });

    const output = formatStatusOutput([result], [comp]);
    expect(output).toContain('1 comparison(s)');
    expect(output).toContain('Avg Lift');
    expect(output).toContain('+0.300');
  });
});

describe('run command', () => {
  let store: InMemoryStore;
  let logSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    store = new InMemoryStore();
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  function makeFakeComparison(scenarioId: string, harness: string): ComparisonResult {
    const record = createSessionRecord({
      id: `${harness}-rec`, scenarioId, sessionNumber: 1, harness,
      agentOutput: '', filesModified: [], transcript: '',
      startedAt: '2026-03-21T10:00:00Z', completedAt: '2026-03-21T10:05:00Z',
    });
    const result = createTestResult({
      id: `${harness}-tr`, scenarioId, harness, sessionRecords: [record],
    });
    return createComparisonResult({
      id: `${harness}-comp`, scenarioId, harness,
      jumboResult: result, baselineResult: result,
      jumboScores: [], baselineScores: [], deltas: [],
    });
  }

  it('exits with clear error when scenario does not exist', async () => {
    const abRunner = jest.fn();
    const program = createProgram({
      storeProvider: async () => store,
      abRunner: abRunner as never,
    });

    await expect(program.parseAsync([
      'node', 'eval', 'run', '--scenario', 'missing-id',
    ])).rejects.toThrow(/Scenario not found: missing-id/);

    expect(abRunner).not.toHaveBeenCalled();
  });

  it('exits with clear error on invalid harness before any execution', async () => {
    const scenario = createTestScenario({
      id: 'sid', name: 'S', initialPrompt: 'p', sessionCount: 2,
    });
    store.scenarios.push(scenario);

    const abRunner = jest.fn();
    const program = createProgram({
      storeProvider: async () => store,
      abRunner: abRunner as never,
    });

    await expect(program.parseAsync([
      'node', 'eval', 'run',
      '--scenario', 'sid',
      '--harness', 'claude-code', 'bogus-harness',
    ])).rejects.toThrow(/Unknown harness/);

    expect(abRunner).not.toHaveBeenCalled();
  });

  it('calls runABComparison once per harness with resolved sessions value', async () => {
    const scenario = createTestScenario({
      id: 'sid', name: 'S', initialPrompt: 'p', sessionCount: 3,
    });
    store.scenarios.push(scenario);

    const calls: Array<{ harness: string; sessionCount: number }> = [];
    const abRunner = jest.fn(async (config: { scenario: TestScenario; adapter: { name: string } }) => {
      calls.push({ harness: config.adapter.name, sessionCount: config.scenario.sessionCount });
      return makeFakeComparison(config.scenario.id, config.adapter.name);
    });

    const program = createProgram({
      storeProvider: async () => store,
      abRunner: abRunner as never,
    });

    await program.parseAsync([
      'node', 'eval', 'run',
      '--scenario', 'sid',
      '--harness', 'claude-code', 'codex-cli',
      '--sessions', '5',
    ]);

    expect(abRunner).toHaveBeenCalledTimes(2);
    expect(calls).toEqual([
      { harness: 'claude-code', sessionCount: 5 },
      { harness: 'codex-cli', sessionCount: 5 },
    ]);
  });

  it('prints ReportGenerator output after a successful run', async () => {
    const scenario = createTestScenario({
      id: 'sid-report', name: 'S', initialPrompt: 'p', sessionCount: 1,
    });
    store.scenarios.push(scenario);

    const abRunner = jest.fn(async (config: { scenario: TestScenario; adapter: { name: string } }) => {
      return makeFakeComparison(config.scenario.id, config.adapter.name);
    });

    const program = createProgram({
      storeProvider: async () => store,
      abRunner: abRunner as never,
    });

    await program.parseAsync([
      'node', 'eval', 'run', '--scenario', 'sid-report',
    ]);

    const output = logSpy.mock.calls.map((c) => String(c[0])).join('\n');
    expect(output).toContain('JUMBO EVALUATION REPORT');
    expect(output).toContain('sid-report');
  });

  it('runs K replications per harness and persists a ReplicationReport retrievable by runId (--replicate 5)', async () => {
    const scenario = createTestScenario({ id: 'sid-rep', name: 'S', initialPrompt: 'p', sessionCount: 1 });
    store.scenarios.push(scenario);

    const abRunner = jest.fn(async (config: { scenario: TestScenario; adapter: { name: string } }) =>
      makeFakeComparison(config.scenario.id, config.adapter.name),
    );
    const program = createProgram({ storeProvider: async () => store, abRunner: abRunner as never });

    await program.parseAsync(['node', 'eval', 'run', '--scenario', 'sid-rep', '--replicate', '5']);

    expect(abRunner).toHaveBeenCalledTimes(5); // 5 replications × 1 harness

    const runIdLine = logSpy.mock.calls.map((c) => String(c[0])).find((l) => l.startsWith('Run ID: '));
    const runId = runIdLine!.replace('Run ID: ', '').trim();
    const report = await store.getReplicationReport(runId);
    expect(report).not.toBeNull();
    expect(report!.k).toBe(5);
    expect(report!.harness).toBe('claude-code');

    const output = logSpy.mock.calls.map((c) => String(c[0])).join('\n');
    expect(output).toContain('REPLICATION REPORT');
  });

  it('keeps single-run behavior and produces no replication report for --replicate 1', async () => {
    const scenario = createTestScenario({ id: 'sid-rep1', name: 'S', initialPrompt: 'p', sessionCount: 1 });
    store.scenarios.push(scenario);

    const abRunner = jest.fn(async (config: { scenario: TestScenario; adapter: { name: string } }) =>
      makeFakeComparison(config.scenario.id, config.adapter.name),
    );
    const program = createProgram({ storeProvider: async () => store, abRunner: abRunner as never });

    await program.parseAsync(['node', 'eval', 'run', '--scenario', 'sid-rep1', '--replicate', '1']);

    expect(abRunner).toHaveBeenCalledTimes(1);
    const output = logSpy.mock.calls.map((c) => String(c[0])).join('\n');
    expect(output).toContain('JUMBO EVALUATION REPORT');
    expect(output).not.toContain('REPLICATION REPORT');
    expect(store.replicationReports.size).toBe(0);
  });

  it('errors when --replicate is below 1', async () => {
    const scenario = createTestScenario({ id: 'sid-rep0', name: 'S', initialPrompt: 'p', sessionCount: 1 });
    store.scenarios.push(scenario);

    const abRunner = jest.fn();
    const program = createProgram({ storeProvider: async () => store, abRunner: abRunner as never });

    await expect(
      program.parseAsync(['node', 'eval', 'run', '--scenario', 'sid-rep0', '--replicate', '0']),
    ).rejects.toThrow(/--replicate must be an integer >= 1/);
    expect(abRunner).not.toHaveBeenCalled();
  });

  it('emits empty-state message when no comparisons were produced', async () => {
    const scenario = createTestScenario({
      id: 'sid-empty', name: 'S', initialPrompt: 'p', sessionCount: 1,
    });
    store.scenarios.push(scenario);

    const program = createProgram({
      storeProvider: async () => store,
      abRunner: (async () => { throw new Error('boom'); }) as never,
    });

    await expect(program.parseAsync([
      'node', 'eval', 'run', '--scenario', 'sid-empty',
    ])).rejects.toThrow(/boom/);
  });

  it('uses scenario sessionCount when --sessions is omitted', async () => {
    const scenario = createTestScenario({
      id: 'sid', name: 'S', initialPrompt: 'p', sessionCount: 4,
    });
    store.scenarios.push(scenario);

    const abRunner = jest.fn(async (config: { scenario: TestScenario; adapter: { name: string } }) => {
      return makeFakeComparison(config.scenario.id, config.adapter.name);
    });

    const program = createProgram({
      storeProvider: async () => store,
      abRunner: abRunner as never,
    });

    await program.parseAsync([
      'node', 'eval', 'run', '--scenario', 'sid',
    ]);

    expect(abRunner).toHaveBeenCalledTimes(1);
    const callArg = abRunner.mock.calls[0][0] as { scenario: TestScenario };
    expect(callArg.scenario.sessionCount).toBe(4);
  });
});
