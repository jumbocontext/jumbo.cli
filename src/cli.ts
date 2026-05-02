#!/usr/bin/env node

/**
 * Jumbo CLI Entry Point
 *
 * Minimal entry point that uses the Host pattern for infrastructure lifecycle.
 * All composition and wiring is encapsulated in infrastructure layer.
 *
 * Flow:
 * 1. Get version (lightweight, no infrastructure)
 * 2. Determine if infrastructure is needed
 * 3. If needed: Host → HostBuilder → Container
 * 4. AppRunner handles routing and execution
 */

import path from "path";
import { Host } from "./infrastructure/host/Host.js";
import { AppRunner } from "./presentation/cli/AppRunner.js";
import { CliVersionReader } from "./infrastructure/cli-metadata/query/CliVersionReader.js";
import { IApplicationContainer } from "./application/host/IApplicationContainer.js";
import { classifyCommand } from "./presentation/cli/commands/CommandClassifier.js";
import { commands } from "./presentation/cli/commands/registry/generated-commands.js";
import { ARGV, FAILURE_EXIT_CODE } from "./presentation/cli/Constants.js";
import { ProjectRootResolver } from "./infrastructure/context/project/ProjectRootResolver.js";

/**
 * Determines if the invocation requires full infrastructure.
 * Uses command metadata for classification.
 */
async function needsInfrastructure(
  argv: string[],
  resolver: ProjectRootResolver
): Promise<boolean> {
  const classification = classifyCommand(argv, commands);

  // Bare 'jumbo' command - needs infra only if project exists
  if (argv.length === ARGV.NODE_AND_SCRIPT_ARG_COUNT) {
    try {
      resolver.resolve();
      return true;
    } catch {
      return false;
    }
  }

  return classification.requiresInfrastructure;
}

/**
 * Guards against running a project-scoped command outside a Jumbo project root.
 *
 * Must run BEFORE Host construction so that no .jumbo directory, SQLite database,
 * or event files are created when the command cannot legitimately proceed.
 */
function enforceProjectRootGuard(
  argv: string[],
  resolver: ProjectRootResolver
): void {
  const classification = classifyCommand(argv, commands);

  if (!classification.requiresProject) {
    return;
  }

  const cwd = process.cwd();
  const ancestor = resolver.findNearest();

  if (ancestor === cwd) {
    return;
  }

  if (ancestor !== null) {
    process.stderr.write(
      `A Jumbo project exists at ${ancestor}. Your current directory is ${cwd}. Change directory back to the project root before running this command.\n`
    );
  } else {
    process.stderr.write(
      `No Jumbo project was found at ${cwd} or any parent directory. If you intended to run this command in an existing project, change directory to it. Only run jumbo project init here if you intend to start a new Jumbo project.\n`
    );
  }

  process.exit(FAILURE_EXIT_CODE);
}

async function main(): Promise<void> {
  // Step 1: Get version (lightweight, no infrastructure needed)
  const versionReader = new CliVersionReader();
  const version = versionReader.getVersion().version;

  // Step 2: Guard against running project-scoped commands outside a project root.
  // Must run before any Host construction so the filesystem stays untouched.
  const argv = process.argv;
  const resolver = new ProjectRootResolver();
  enforceProjectRootGuard(argv, resolver);

  // Step 3: Determine if we need full infrastructure
  const requiresInfra = await needsInfrastructure(argv, resolver);

  // Step 4: Build container if needed
  let container: IApplicationContainer | null = null;

  if (requiresInfra) {
    const projectRoot = resolver.resolveOrDefault();
    const jumboRoot = path.join(projectRoot, ".jumbo");
    const host = new Host(jumboRoot);
    const builder = host.createBuilder();
    container = await builder.build();
  }

  // Step 5: Run the application
  const appRunner = new AppRunner(version, container);
  await appRunner.run();
}

main();
