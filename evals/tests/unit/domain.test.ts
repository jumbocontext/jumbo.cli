import { describe, it, expect } from '@jest/globals';
import { createTestScenario, createSessionRecord, createTestResult } from '../../src/domain/types.js';

describe('TestScenario', () => {
  it('creates a valid scenario with all required fields', () => {
    const scenario = createTestScenario({
      id: 'scenario-1',
      name: 'Basic TypeScript project',
      initialPrompt: 'Build a hello world TypeScript project',
      sessionCount: 1,
    });

    expect(scenario.id).toBe('scenario-1');
    expect(scenario.name).toBe('Basic TypeScript project');
    expect(scenario.initialPrompt).toBe('Build a hello world TypeScript project');
    expect(scenario.sessionCount).toBe(1);
    expect(scenario.createdAt).toBeDefined();
  });

  it('rejects empty id', () => {
    expect(() =>
      createTestScenario({ id: '', name: 'test', initialPrompt: 'prompt', sessionCount: 1 }),
    ).toThrow('TestScenario requires an id');
  });

  it('rejects empty name', () => {
    expect(() =>
      createTestScenario({ id: 'id', name: '', initialPrompt: 'prompt', sessionCount: 1 }),
    ).toThrow('TestScenario requires a name');
  });

  it('rejects empty initialPrompt', () => {
    expect(() =>
      createTestScenario({ id: 'id', name: 'name', initialPrompt: '', sessionCount: 1 }),
    ).toThrow('TestScenario requires an initialPrompt');
  });

  it('rejects sessionCount < 1', () => {
    expect(() =>
      createTestScenario({ id: 'id', name: 'name', initialPrompt: 'prompt', sessionCount: 0 }),
    ).toThrow('TestScenario requires sessionCount >= 1');
  });

  it('accepts valid structuralAssertions', () => {
    const scenario = createTestScenario({
      id: 'id',
      name: 'name',
      initialPrompt: 'prompt',
      sessionCount: 3,
      structuralAssertions: [
        { id: 'a1', file: 'src/a.ts', sessionNumber: 1, matcher: { kind: 'fileExists' } },
        { id: 'a2', file: 'src/b.ts', sessionNumber: 3, matcher: { kind: 'matchesRegex', pattern: 'x' } },
      ],
    });
    expect(scenario.structuralAssertions).toHaveLength(2);
  });

  it('rejects a structural assertion with no id', () => {
    expect(() =>
      createTestScenario({
        id: 'id',
        name: 'name',
        initialPrompt: 'prompt',
        sessionCount: 1,
        structuralAssertions: [{ id: '', file: 'src/a.ts', sessionNumber: 1, matcher: { kind: 'fileExists' } }],
      }),
    ).toThrow('require an id');
  });

  it('rejects duplicate structural assertion ids', () => {
    expect(() =>
      createTestScenario({
        id: 'id',
        name: 'name',
        initialPrompt: 'prompt',
        sessionCount: 1,
        structuralAssertions: [
          { id: 'dup', file: 'src/a.ts', sessionNumber: 1, matcher: { kind: 'fileExists' } },
          { id: 'dup', file: 'src/b.ts', sessionNumber: 1, matcher: { kind: 'fileExists' } },
        ],
      }),
    ).toThrow('duplicate id: dup');
  });

  it('rejects a structural assertion with no file glob', () => {
    expect(() =>
      createTestScenario({
        id: 'id',
        name: 'name',
        initialPrompt: 'prompt',
        sessionCount: 1,
        structuralAssertions: [{ id: 'a1', file: '', sessionNumber: 1, matcher: { kind: 'fileExists' } }],
      }),
    ).toThrow('requires a file glob');
  });

  it('rejects a structural assertion whose sessionNumber exceeds sessionCount', () => {
    expect(() =>
      createTestScenario({
        id: 'id',
        name: 'name',
        initialPrompt: 'prompt',
        sessionCount: 3,
        structuralAssertions: [{ id: 'a1', file: 'src/a.ts', sessionNumber: 4, matcher: { kind: 'fileExists' } }],
      }),
    ).toThrow('sessionNumber must be an integer in 1..3');
  });
});

describe('SessionRecord', () => {
  it('creates a valid session record', () => {
    const record = createSessionRecord({
      id: 'session-1',
      scenarioId: 'scenario-1',
      sessionNumber: 1,
      harness: 'claude-code',
      variant: 'baseline',
      scenarioPrompt: 'Build the app',
      effectivePrompt: 'Build the app',
      agentOutput: 'Created index.ts',
      filesModified: ['index.ts'],
      transcript: 'full transcript...',
      jumboLifecycleAudit: {
        sessionStartExecuted: true,
        goalStartExecuted: true,
        goalSubmitExecuted: true,
        sessionEndExecuted: true,
        activeGoalId: 'goal-1',
        goalStatusBefore: 'refined',
        goalStatusAfter: 'submitted',
        sessionsTotalDelta: 1,
        sessionsEndedDelta: 1,
        evidence: {},
      },
      startedAt: '2026-03-21T10:00:00Z',
      completedAt: '2026-03-21T10:05:00Z',
    });

    expect(record.id).toBe('session-1');
    expect(record.scenarioId).toBe('scenario-1');
    expect(record.sessionNumber).toBe(1);
    expect(record.harness).toBe('claude-code');
    expect(record.variant).toBe('baseline');
    expect(record.scenarioPrompt).toBe('Build the app');
    expect(record.effectivePrompt).toBe('Build the app');
    expect(record.filesModified).toEqual(['index.ts']);
    expect(record.jumboLifecycleAudit?.goalSubmitExecuted).toBe(true);
    expect(record.jumboLifecycleAudit?.activeGoalId).toBe('goal-1');
  });

  it('rejects empty id', () => {
    expect(() =>
      createSessionRecord({
        id: '',
        scenarioId: 'scenario-1',
        sessionNumber: 1,
        harness: 'claude-code',
        agentOutput: '',
        filesModified: [],
        transcript: '',
        startedAt: '',
        completedAt: '',
      }),
    ).toThrow('SessionRecord requires an id');
  });

  it('rejects sessionNumber < 1', () => {
    expect(() =>
      createSessionRecord({
        id: 'id',
        scenarioId: 'scenario-1',
        sessionNumber: 0,
        harness: 'claude-code',
        agentOutput: '',
        filesModified: [],
        transcript: '',
        startedAt: '',
        completedAt: '',
      }),
    ).toThrow('SessionRecord requires sessionNumber >= 1');
  });
});

describe('TestResult', () => {
  it('creates a valid test result with session records', () => {
    const record = createSessionRecord({
      id: 'session-1',
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

    expect(result.id).toBe('result-1');
    expect(result.sessionRecords).toHaveLength(1);
    expect(result.createdAt).toBeDefined();
  });

  it('rejects empty id', () => {
    expect(() =>
      createTestResult({ id: '', scenarioId: 'scenario-1', harness: 'claude-code', sessionRecords: [] }),
    ).toThrow('TestResult requires an id');
  });
});
