import { randomUUID } from 'node:crypto';
import type { TestScenario, SessionRecord } from './domain/types.js';
import { createSessionRecord } from './domain/types.js';
import type { ResultStore } from './storage/result-store.js';
import type { LocalExecutor } from './infrastructure/local-executor.js';
import type { ExecResult } from './infrastructure/container-manager.js';
import type { HarnessAdapter } from './harness/harness-adapter.js';

export class HarnessExecutionError extends Error {
  constructor(
    message: string,
    readonly result: ExecResult,
    readonly sessionRecord: SessionRecord,
  ) {
    super(message);
    this.name = 'HarnessExecutionError';
  }
}

/**
 * Runs a single session of a test scenario in a local working directory.
 * This is the minimal end-to-end path: one scenario, one session, one harness.
 *
 * Pure orchestration — I/O is delegated to LocalExecutor, HarnessAdapter,
 * and ResultStore which are injected as parameters.
 */
export async function runSession(params: {
  scenario: TestScenario;
  sessionNumber: number;
  variant?: 'jumbo' | 'baseline';
  prompt?: string;
  scenarioPrompt?: string;
  deliveredContext?: string;
  workDir: string;
  executor: LocalExecutor;
  adapter: HarnessAdapter;
  store: ResultStore;
  env?: Record<string, string | undefined>;
}): Promise<SessionRecord> {
  const {
    scenario,
    sessionNumber,
    variant,
    workDir,
    executor,
    adapter,
    store,
    deliveredContext,
  } = params;
  const scenarioPrompt = params.scenarioPrompt ?? scenario.initialPrompt;
  const effectivePrompt = params.prompt ?? scenarioPrompt;

  const startedAt = new Date().toISOString();

  const command = adapter.buildCommand();
  const execResult = await executor.exec(workDir, command, { stdin: effectivePrompt, env: params.env });
  const parsed = adapter.parseOutput(execResult);

  const completedAt = new Date().toISOString();
  const workspaceSnapshot = await executor.captureWorkspaceSnapshot(workDir);

  const record = createSessionRecord({
    id: randomUUID(),
    scenarioId: scenario.id,
    sessionNumber,
    harness: adapter.name,
    variant,
    scenarioPrompt,
    effectivePrompt,
    deliveredContext,
    agentOutput: parsed.agentOutput,
    filesModified: parsed.filesModified,
    transcript: parsed.transcript,
    workspaceSnapshot,
    inputTokens: parsed.inputTokens,
    outputTokens: parsed.outputTokens,
    startedAt,
    completedAt,
  });

  await store.saveSessionRecord(record);

  if (execResult.exitCode !== 0) {
    throw new HarnessExecutionError(
      `harness ${adapter.name} session ${sessionNumber} failed with exit code ${execResult.exitCode}`,
      execResult,
      record,
    );
  }

  return record;
}
