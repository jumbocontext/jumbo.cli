#!/usr/bin/env node

import path from "path";
import { Host } from "../../infrastructure/host/Host.js";
import { ProjectRootResolver } from "../../infrastructure/context/project/ProjectRootResolver.js";
import { AgentCliGateway } from "../../infrastructure/agents/AgentCliGateway.js";
import { CodifierProcessEvent, CodifierProcessManager } from "../../application/context/goals/codify/CodifierProcessManager.js";

const DEFAULT_MAX_RETRIES = 3;
const FAILURE_EXIT_CODE = 1;

interface CodifierDaemonOptions {
  readonly agentId: string;
  readonly maxRetries: number;
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

  const result = await manager.processNext({
    agentId: options.agentId,
    maxRetries: options.maxRetries,
    emit: writeDaemonEvent,
  });

  if (result.status === "failed" || result.status === "exhausted") {
    process.exitCode = FAILURE_EXIT_CODE;
  }
}

function parseOptions(argv: string[]): CodifierDaemonOptions {
  return {
    agentId: readOption(argv, "--agent") ?? "codex",
    maxRetries: parsePositiveInt(readOption(argv, "--max-retries"), DEFAULT_MAX_RETRIES),
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

function writeDaemonEvent(event: CodifierProcessEvent): void {
  process.stdout.write(`${JSON.stringify(event)}\n`);
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
