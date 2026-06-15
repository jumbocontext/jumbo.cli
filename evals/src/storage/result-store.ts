import type { EvalRunRecord, RunControlFile, RunHeartbeat, TestScenario, SessionRecord, TestResult } from '../domain/types.js';

/**
 * Abstract storage interface for eval artifacts.
 * Backed by JSON files now, designed for SQLite graduation later.
 * Consumers depend on this interface, not the implementation.
 */
export interface ResultStore {
  saveScenario(scenario: TestScenario): Promise<void>;
  getScenario(id: string): Promise<TestScenario | null>;
  listScenarios(): Promise<TestScenario[]>;

  saveSessionRecord(record: SessionRecord): Promise<void>;
  getSessionRecords(scenarioId: string): Promise<SessionRecord[]>;

  saveTestResult(result: TestResult): Promise<void>;
  getTestResult(id: string): Promise<TestResult | null>;
  listTestResults(scenarioId?: string): Promise<TestResult[]>;

  saveRunRecord(record: EvalRunRecord): Promise<void>;
  getRunRecord(runId: string): Promise<EvalRunRecord | null>;
  listRunRecords(scenarioId?: string): Promise<EvalRunRecord[]>;
  writeHeartbeat(runId: string, heartbeat: RunHeartbeat): Promise<void>;
  readHeartbeat(runId: string): Promise<RunHeartbeat | null>;

  writeRunControl(runId: string, control: RunControlFile): Promise<void>;
  readRunControl(runId: string): Promise<RunControlFile | null>;
}
