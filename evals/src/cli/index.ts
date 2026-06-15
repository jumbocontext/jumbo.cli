#!/usr/bin/env node

import { Command } from 'commander';
import * as path from 'node:path';
import { StoreHeartbeatWriter } from '../infrastructure/heartbeat-writer.js';
import type { LocalExecutor } from '../infrastructure/local-executor.js';
import type { HarnessAdapter } from '../harness/harness-adapter.js';
import { JsonResultStore } from '../storage/json-result-store.js';
import type { ResultStore } from '../storage/result-store.js';
import { registerScenarioCommands } from './commands/scenario-create.js';
import { registerScenarioListCommand } from './commands/scenario-list.js';
import { registerRunCommand, type ABRunner, type HeartbeatWriterProvider } from './commands/run.js';
import { registerScoreCommand } from './commands/score.js';
import { registerReportCommand } from './commands/report.js';
import { registerStatusCommand } from './commands/status.js';
import { registerControlCommand } from './commands/control.js';

export interface CliDeps {
  readonly storeProvider: () => Promise<ResultStore>;
  readonly abRunner?: ABRunner;
  readonly heartbeatWriterProvider?: HeartbeatWriterProvider;
  readonly executorProvider?: () => LocalExecutor;
  readonly adapterProvider?: (name: string) => HarnessAdapter;
}

function defaultStoreProvider(): () => Promise<ResultStore> {
  return async () => {
    const base = process.env.EVAL_STORE_PATH ?? path.join(process.cwd(), '.eval-store');
    const store = new JsonResultStore(base);
    await store.initialize();
    return store;
  };
}

export function createProgram(deps?: CliDeps): Command {
  const storeProvider = deps?.storeProvider ?? defaultStoreProvider();
  const heartbeatWriterProvider = deps?.heartbeatWriterProvider ?? defaultHeartbeatWriterProvider;

  const program = new Command();

  program
    .name('eval')
    .description('Jumbo longitudinal evaluation system — measure Jumbo lift across harnesses and sessions')
    .version('0.1.0');

  const scenario = program
    .command('scenario')
    .description('Manage test scenarios');

  registerScenarioCommands(scenario, { storeProvider });
  registerScenarioListCommand(scenario, { storeProvider });

  registerRunCommand(program, {
    storeProvider,
    abRunner: deps?.abRunner,
    heartbeatWriterProvider,
    executorProvider: deps?.executorProvider,
    adapterProvider: deps?.adapterProvider,
  });
  registerScoreCommand(program, { storeProvider });
  registerReportCommand(program, { storeProvider });
  registerStatusCommand(program, { storeProvider });
  registerControlCommand(program, { storeProvider });

  return program;
}

const defaultHeartbeatWriterProvider: HeartbeatWriterProvider = async (params: {
  readonly store: ResultStore;
  readonly runId: string;
  readonly scenarioId: string;
  readonly harnesses: readonly string[];
  readonly sessionCount: number;
}) => {
  if (!hasRunStateMethods(params.store)) return undefined;
  return new StoreHeartbeatWriter(params.store, params);
};

function hasRunStateMethods(store: ResultStore): boolean {
  const candidate = store as Partial<ResultStore>;
  return typeof candidate.saveRunRecord === 'function'
    && typeof candidate.writeHeartbeat === 'function';
}

export function isMainModule(modulePath: string, argv1: string | undefined): boolean {
  if (!argv1) return false;
  try {
    return path.resolve(modulePath) === path.resolve(argv1);
  } catch {
    return false;
  }
}

if (isMainModule(__filename, process.argv[1])) {
  const program = createProgram();
  program.parseAsync(process.argv).catch((err: Error) => {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  });
}
