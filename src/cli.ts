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
import { ARGV } from "./presentation/cli/Constants.js";
import { ProjectRootResolver } from "./infrastructure/context/project/ProjectRootResolver.js";

/**
 * Determines if the invocation requires full infrastructure.
 * Uses command metadata for classification.
 */
async function needsInfrastructure(argv: string[]): Promise<boolean> {
  const classification = classifyCommand(argv, commands);

  // Bare 'jumbo' command - needs infra only if project exists
  if (argv.length === ARGV.NODE_AND_SCRIPT_ARG_COUNT) {
    try {
      new ProjectRootResolver().resolve();
      return true;
    } catch {
      return false;
    }
  }

  return classification.requiresInfrastructure;
}

async function main(): Promise<void> {
  // Step 1: Get version (lightweight, no infrastructure needed)
  const versionReader = new CliVersionReader();
  const version = versionReader.getVersion().version;

  // Step 2: Determine if we need full infrastructure
  const argv = process.argv;
  const requiresInfra = await needsInfrastructure(argv);

  // Step 3: Build container if needed
  let container: IApplicationContainer | null = null;

  if (requiresInfra) {
    const projectRoot = new ProjectRootResolver().resolve();
    const jumboRoot = path.join(projectRoot, ".jumbo");
    const host = new Host(jumboRoot);
    const builder = host.createBuilder();
    container = await builder.build();
  }

  // Step 4: Run the application
  const appRunner = new AppRunner(version, container);
  await appRunner.run();
}

main();
