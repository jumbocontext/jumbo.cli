import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { JsonResultStore } from '../../src/storage/json-result-store.js';
import { createTestScenario, createSessionRecord, createTestResult } from '../../src/domain/types.js';

describe('JsonResultStore', () => {
  let tmpDir: string;
  let store: JsonResultStore;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'jumbo-evals-test-'));
    store = new JsonResultStore(tmpDir);
    await store.initialize();
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  describe('scenarios', () => {
    it('saves and retrieves a scenario', async () => {
      const scenario = createTestScenario({
        id: 'scenario-1',
        name: 'Test scenario',
        initialPrompt: 'Build something',
        sessionCount: 3,
      });

      await store.saveScenario(scenario);
      const retrieved = await store.getScenario('scenario-1');

      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe('scenario-1');
      expect(retrieved!.name).toBe('Test scenario');
      expect(retrieved!.sessionCount).toBe(3);
    });

    it('returns null for non-existent scenario', async () => {
      const result = await store.getScenario('does-not-exist');
      expect(result).toBeNull();
    });

    it('lists all scenarios', async () => {
      await store.saveScenario(createTestScenario({ id: 's1', name: 'A', initialPrompt: 'p1', sessionCount: 1 }));
      await store.saveScenario(createTestScenario({ id: 's2', name: 'B', initialPrompt: 'p2', sessionCount: 2 }));

      const scenarios = await store.listScenarios();
      expect(scenarios).toHaveLength(2);
    });
  });

  describe('session records', () => {
    it('saves and retrieves session records by scenario', async () => {
      const record = createSessionRecord({
        id: 'rec-1',
        scenarioId: 'scenario-1',
        sessionNumber: 1,
        harness: 'claude-code',
        agentOutput: 'output',
        filesModified: ['file.ts'],
        transcript: 'transcript',
        startedAt: '2026-03-21T10:00:00Z',
        completedAt: '2026-03-21T10:05:00Z',
      });

      await store.saveSessionRecord(record);
      const records = await store.getSessionRecords('scenario-1');

      expect(records).toHaveLength(1);
      expect(records[0].id).toBe('rec-1');
      expect(records[0].filesModified).toEqual(['file.ts']);
    });

    it('filters session records by scenarioId', async () => {
      await store.saveSessionRecord(createSessionRecord({
        id: 'rec-1', scenarioId: 'scenario-1', sessionNumber: 1, harness: 'claude-code',
        agentOutput: '', filesModified: [], transcript: '', startedAt: '', completedAt: '',
      }));
      await store.saveSessionRecord(createSessionRecord({
        id: 'rec-2', scenarioId: 'scenario-2', sessionNumber: 1, harness: 'claude-code',
        agentOutput: '', filesModified: [], transcript: '', startedAt: '', completedAt: '',
      }));

      const records = await store.getSessionRecords('scenario-1');
      expect(records).toHaveLength(1);
      expect(records[0].scenarioId).toBe('scenario-1');
    });
  });

  describe('test results', () => {
    it('saves and retrieves a test result', async () => {
      const result = createTestResult({
        id: 'result-1',
        scenarioId: 'scenario-1',
        harness: 'claude-code',
        sessionRecords: [],
      });

      await store.saveTestResult(result);
      const retrieved = await store.getTestResult('result-1');

      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe('result-1');
    });

    it('returns null for non-existent result', async () => {
      const result = await store.getTestResult('nope');
      expect(result).toBeNull();
    });

    it('lists results filtered by scenario', async () => {
      await store.saveTestResult(createTestResult({
        id: 'r1', scenarioId: 'scenario-1', harness: 'claude-code', sessionRecords: [],
      }));
      await store.saveTestResult(createTestResult({
        id: 'r2', scenarioId: 'scenario-2', harness: 'claude-code', sessionRecords: [],
      }));

      const results = await store.listTestResults('scenario-1');
      expect(results).toHaveLength(1);
      expect(results[0].scenarioId).toBe('scenario-1');
    });

    it('lists all results when no filter', async () => {
      await store.saveTestResult(createTestResult({
        id: 'r1', scenarioId: 'scenario-1', harness: 'claude-code', sessionRecords: [],
      }));
      await store.saveTestResult(createTestResult({
        id: 'r2', scenarioId: 'scenario-2', harness: 'claude-code', sessionRecords: [],
      }));

      const results = await store.listTestResults();
      expect(results).toHaveLength(2);
    });
  });
});
