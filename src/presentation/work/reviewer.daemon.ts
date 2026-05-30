#!/usr/bin/env node

import path from "path";
import { PollingLoop } from "../../application/daemons/PollingLoop.js";
import { ReviewerProcessManager } from "../../application/context/goals/review/ReviewerProcessManager.js";
import { AgentCliGateway } from "../../infrastructure/agents/AgentCliGateway.js";
import { IntervalTicker } from "../../infrastructure/daemons/IntervalTicker.js";
import { ProcessSignalSource } from "../../infrastructure/daemons/ProcessSignalSource.js";
import { ProjectRootResolver } from "../../infrastructure/context/project/ProjectRootResolver.js";
import { Host } from "../../infrastructure/host/Host.js";
import type { ProcessManagerEvent } from "../../application/daemons/IProcessManager.js";

const DEFAULT_AGENT_ID = "codex";
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_POLL_INTERVAL_MS = 30_000;
const FAILURE_EXIT_CODE = 1;
const DAEMON_EVENT_TEXT_FIELD_MAX_LENGTH = 2_048;

export async function runReviewerDaemon(argv = process.argv): Promise<void> {
  const projectRoot = resolveProjectRoot();
  const host = new Host(path.join(projectRoot, ".jumbo"));
  const container = await host.createBuilder().build();
  const manager = new ReviewerProcessManager(
    container.goalStatusReader,
    container.goalContextReader,
    container.goalClaimPolicy,
    container.workerIdentityReader,
    container.reviewGoalController,
    new AgentCliGateway(container.telemetryClient),
    container.telemetryClient,
  );

  await new PollingLoop().run({
    processManager: manager,
    processOptions: {
      agentId: readOption(argv, "--agent") ?? DEFAULT_AGENT_ID,
      maxRetries: readPositiveInt(argv, "--max-retries", DEFAULT_MAX_RETRIES),
      emit: writeDaemonEvent,
    },
    ticker: new IntervalTicker(readPositiveInt(argv, "--poll-interval-ms", DEFAULT_POLL_INTERVAL_MS)),
    shutdownSignal: new ProcessSignalSource(),
  });
}

function resolveProjectRoot(): string {
  const projectRoot = new ProjectRootResolver().findNearest();
  if (projectRoot === null) {
    process.stderr.write("No Jumbo project was found at the current directory or any parent directory.\n");
    process.exit(FAILURE_EXIT_CODE);
  }
  return projectRoot;
}

function readOption(argv: string[], name: string): string | undefined {
  const index = argv.indexOf(name);
  return index === -1 ? undefined : argv[index + 1];
}

function readPositiveInt(argv: string[], name: string, fallback: number): number {
  const parsed = Number.parseInt(readOption(argv, name) ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
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

if (process.argv[1]?.endsWith("reviewer.daemon.js")) {
  runReviewerDaemon().catch((error) => {
    writeDaemonEvent({
      daemon: "reviewer",
      status: "failed",
      errorType: error instanceof Error ? error.name : "UnknownError",
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    process.exit(FAILURE_EXIT_CODE);
  });
}
