import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { EvalRunRecord, ReplicationReport, RunControlFile, RunHeartbeat, TestScenario, SessionRecord, TestResult } from '../domain/types.js';
import type { ResultStore } from './result-store.js';

function isEnoent(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as Record<string, unknown>).code === 'ENOENT';
}

/**
 * JSON file-backed ResultStore implementation.
 * Each entity type gets its own directory under the base path.
 * Each entity is stored as an individual JSON file keyed by id.
 */
export class JsonResultStore implements ResultStore {
  private readonly scenariosDir: string;
  private readonly sessionsDir: string;
  private readonly resultsDir: string;
  private readonly runsDir: string;
  private readonly heartbeatWrites = new Map<string, Promise<void>>();
  private readonly controlWrites = new Map<string, Promise<void>>();

  constructor(private readonly basePath: string) {
    this.scenariosDir = path.join(basePath, 'scenarios');
    this.sessionsDir = path.join(basePath, 'sessions');
    this.resultsDir = path.join(basePath, 'results');
    this.runsDir = path.join(basePath, 'runs');
  }

  async initialize(): Promise<void> {
    await fs.mkdir(this.scenariosDir, { recursive: true });
    await fs.mkdir(this.sessionsDir, { recursive: true });
    await fs.mkdir(this.resultsDir, { recursive: true });
    await fs.mkdir(this.runsDir, { recursive: true });
  }

  async saveScenario(scenario: TestScenario): Promise<void> {
    const filePath = path.join(this.scenariosDir, `${scenario.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(scenario, null, 2), 'utf-8');
  }

  async getScenario(id: string): Promise<TestScenario | null> {
    return this.readJson<TestScenario>(path.join(this.scenariosDir, `${id}.json`));
  }

  async listScenarios(): Promise<TestScenario[]> {
    return this.readAllJson<TestScenario>(this.scenariosDir);
  }

  async saveSessionRecord(record: SessionRecord): Promise<void> {
    const filePath = path.join(this.sessionsDir, `${record.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(record, null, 2), 'utf-8');
  }

  async getSessionRecords(scenarioId: string): Promise<SessionRecord[]> {
    const all = await this.readAllJson<SessionRecord>(this.sessionsDir);
    return all.filter((r) => r.scenarioId === scenarioId);
  }

  async saveTestResult(result: TestResult): Promise<void> {
    const filePath = path.join(this.resultsDir, `${result.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(result, null, 2), 'utf-8');
  }

  async getTestResult(id: string): Promise<TestResult | null> {
    return this.readJson<TestResult>(path.join(this.resultsDir, `${id}.json`));
  }

  async listTestResults(scenarioId?: string): Promise<TestResult[]> {
    const all = await this.readAllJson<TestResult>(this.resultsDir);
    if (scenarioId) {
      return all.filter((r) => r.scenarioId === scenarioId);
    }
    return all;
  }

  async saveRunRecord(record: EvalRunRecord): Promise<void> {
    const runDir = this.runDir(record.runId);
    await fs.mkdir(runDir, { recursive: true });
    await fs.writeFile(path.join(runDir, 'run.json'), JSON.stringify(record, null, 2), 'utf-8');
  }

  async getRunRecord(runId: string): Promise<EvalRunRecord | null> {
    return this.readJson<EvalRunRecord>(path.join(this.runDir(runId), 'run.json'));
  }

  async listRunRecords(scenarioId?: string): Promise<EvalRunRecord[]> {
    const runDirs = await this.readRunDirs();
    const records = await Promise.all(
      runDirs.map((runDir) => this.readJson<EvalRunRecord>(path.join(runDir, 'run.json'))),
    );
    const all = records.filter((record): record is EvalRunRecord => record !== null);
    if (scenarioId) {
      return all.filter((record) => record.scenarioId === scenarioId);
    }
    return all;
  }

  async writeHeartbeat(runId: string, heartbeat: RunHeartbeat): Promise<void> {
    const runDir = this.runDir(runId);
    await fs.mkdir(runDir, { recursive: true });
    const filePath = path.join(runDir, 'state.json');
    const previous = this.heartbeatWrites.get(filePath) ?? Promise.resolve();
    const next = previous.then(() => this.atomicWriteJson(filePath, heartbeat));
    this.heartbeatWrites.set(filePath, next.catch(() => {}));
    await next;
  }

  async readHeartbeat(runId: string): Promise<RunHeartbeat | null> {
    return this.readJson<RunHeartbeat>(path.join(this.runDir(runId), 'state.json'));
  }

  async writeRunControl(runId: string, control: RunControlFile): Promise<void> {
    const runDir = this.runDir(runId);
    await fs.mkdir(runDir, { recursive: true });
    const filePath = path.join(runDir, 'control.json');
    const previous = this.controlWrites.get(filePath) ?? Promise.resolve();
    const next = previous.then(() => this.atomicWriteJson(filePath, control));
    this.controlWrites.set(filePath, next.catch(() => {}));
    await next;
  }

  async readRunControl(runId: string): Promise<RunControlFile | null> {
    return this.readJson<RunControlFile>(path.join(this.runDir(runId), 'control.json'));
  }

  async saveReplicationReport(runId: string, report: ReplicationReport): Promise<void> {
    const runDir = this.runDir(runId);
    await fs.mkdir(runDir, { recursive: true });
    await this.atomicWriteJson(path.join(runDir, 'replication.json'), report);
  }

  async getReplicationReport(runId: string): Promise<ReplicationReport | null> {
    return this.readJson<ReplicationReport>(path.join(this.runDir(runId), 'replication.json'));
  }

  private runDir(runId: string): string {
    return path.join(this.runsDir, runId);
  }

  private async atomicWriteJson(filePath: string, value: unknown): Promise<void> {
    const tmpPath = `${filePath}.${process.pid}.${Date.now()}.${randomUUID()}.tmp`;
    await fs.writeFile(tmpPath, JSON.stringify(value, null, 2), 'utf-8');
    await renameWithRetry(tmpPath, filePath);
  }

  private async readRunDirs(): Promise<string[]> {
    try {
      const entries = await fs.readdir(this.runsDir, { withFileTypes: true });
      return entries.filter((entry) => entry.isDirectory()).map((entry) => path.join(this.runsDir, entry.name));
    } catch (err: unknown) {
      if (isEnoent(err)) return [];
      throw err;
    }
  }

  private async readJson<T>(filePath: string): Promise<T | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content) as T;
    } catch (err: unknown) {
      if (isEnoent(err)) return null;
      throw err;
    }
  }

  private async readAllJson<T>(dirPath: string): Promise<T[]> {
    try {
      const files = await fs.readdir(dirPath);
      const jsonFiles = files.filter((f) => f.endsWith('.json'));
      const items = await Promise.all(
        jsonFiles.map(async (f) => {
          const content = await fs.readFile(path.join(dirPath, f), 'utf-8');
          return JSON.parse(content) as T;
        }),
      );
      return items;
    } catch (err: unknown) {
      if (isEnoent(err)) return [];
      throw err;
    }
  }
}

async function renameWithRetry(from: string, to: string): Promise<void> {
  const retryable = new Set(['EPERM', 'EBUSY', 'EACCES']);
  let lastErr: unknown;
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      await fs.rename(from, to);
      return;
    } catch (err: unknown) {
      lastErr = err;
      const code = typeof err === 'object' && err !== null ? (err as Record<string, unknown>).code : undefined;
      if (!retryable.has(String(code))) throw err;
      await new Promise((resolve) => setTimeout(resolve, 5 * (attempt + 1)));
    }
  }
  throw lastErr;
}
