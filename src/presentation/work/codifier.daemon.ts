#!/usr/bin/env node

import path from "path";
import { PollingLoop } from "../../application/daemons/PollingLoop.js";
import type { ProcessManagerEvent } from "../../application/daemons/IProcessManager.js";
import { Host } from "../../infrastructure/host/Host.js";
import { ProjectRootResolver } from "../../infrastructure/context/project/ProjectRootResolver.js";
import { AgentCliGateway } from "../../infrastructure/agents/AgentCliGateway.js";
import { IntervalTicker } from "../../infrastructure/daemons/IntervalTicker.js";
import { ProcessSignalSource } from "../../infrastructure/daemons/ProcessSignalSource.js";
import { CodifierProcessManager } from "../../application/context/goals/codify/CodifierProcessManager.js";

const DEFAULT_AGENT_ID = "codex";
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_POLL_INTERVAL_MS = 30_000;
const FAILURE_EXIT_CODE = 1;
const DAEMON_EVENT_TEXT_FIELD_MAX_LENGTH = 2_048;

interface CodifierDaemonOptions {
  readonly agentId: string;
  readonly maxRetries: number;
  readonly pollIntervalMs: number;
}

export async function runCodifierDaemon(argv = process.argv): Promise<void> {
  const options = parseOptions(argv);
  const projectRoot = resolveProjectRoot();
  const host = new Host(path.join(projectRoot, ".jumbo"));
  const container = await host.createBuilder().build();

  const manager = new CodifierProcessManager(
    container.goalStatusReader,
    container.goalCodifyingStartedProjector,
    container.goalClaimPolicy,
    container.workerIdentityReader,
    container.codifyGoalController,
    new AgentCliGateway(container.telemetryClient),
    container.telemetryClient,
  );

  await new PollingLoop().run({
    processManager: manager,
    processOptions: {
      agentId: options.agentId,
      maxRetries: options.maxRetries,
      emit: writeDaemonEvent,
    },
    ticker: new IntervalTicker(options.pollIntervalMs),
    shutdownSignal: new ProcessSignalSource(),
  });
}

function parseOptions(argv: string[]): CodifierDaemonOptions {
  return {
    agentId: readOption(argv, "--agent") ?? DEFAULT_AGENT_ID,
    maxRetries: parsePositiveInt(readOption(argv, "--max-retries"), DEFAULT_MAX_RETRIES),
    pollIntervalMs: parsePositiveInt(readOption(argv, "--poll-interval-ms"), DEFAULT_POLL_INTERVAL_MS),
  };
}

function readOption(argv: string[], name: string): string | undefined {
  const index = argv.indexOf(name);
  if (index === -1) {
    return undefined;
  }

  return argv[index + 1];
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function resolveProjectRoot(): string {
  const resolver = new ProjectRootResolver();
  const projectRoot = resolver.findNearest();

  if (projectRoot === null) {
    process.stderr.write(
      "No Jumbo project was found at the current directory or any parent directory.\n",
    );
    process.exit(FAILURE_EXIT_CODE);
  }

  return projectRoot;
}

function writeDaemonEvent(event: ProcessManagerEvent): void {
  process.stdout.write(`${JSON.stringify(boundDaemonEvent(event))}\n`);
}

function boundDaemonEvent(event: ProcessManagerEvent): ProcessManagerEvent {
  return {
    ...event,
    daemon: limitTextTail(event.daemon, DAEMON_EVENT_TEXT_FIELD_MAX_LENGTH),
    source: boundOptionalText(event.source),
    category: boundOptionalText(event.category),
    message: boundOptionalText(event.message),
    goalId: boundOptionalText(event.goalId),
    errorType: boundOptionalText(event.errorType),
    errorMessage: boundOptionalText(event.errorMessage),
  };
}

function boundOptionalText(value: string | undefined): string | undefined {
  return value === undefined ? undefined : limitTextTail(value, DAEMON_EVENT_TEXT_FIELD_MAX_LENGTH);
}

function limitTextTail(value: string, maxLength: number): string {
  return value.length > maxLength ? value.slice(-maxLength) : value;
}

if (process.argv[1]?.endsWith("codifier.daemon.js")) {
  runCodifierDaemon().catch((error) => {
    writeDaemonEvent({
      daemon: "codifier",
      status: "failed",
      errorType: error instanceof Error ? error.name : "UnknownError",
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    process.exit(FAILURE_EXIT_CODE);
  });
}
