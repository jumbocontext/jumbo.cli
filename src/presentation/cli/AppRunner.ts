/**
 * App Runner - CLI Execution
 *
 * Runs the CLI with a pre-built container.
 * No knowledge of infrastructure internals.
 *
 * This class handles:
 * - Invocation classification (banner, help, version, command)
 * - Routing to appropriate handlers
 * - Command execution with container
 *
 * Key Design:
 * - Receives IApplicationContainer (interfaces only)
 * - No bootstrap imports
 * - No concrete infrastructure types
 */

import path from "path";
import fs from "fs-extra";
import { IApplicationContainer } from "../../application/host/IApplicationContainer.js";
import { commands } from "./commands/registry/generated-commands.js";
import { CommanderApplicator } from "./commands/registry/CommanderApplicator.js";
import { createProgram } from "./program/ProgramFactory.js";
import { attachGlobalOptions } from "./program/GlobalOptionsHandler.js";
import { validateProjectRequirement } from "./guards/ProjectGuard.js";
import {
  isBareCommand,
  showBannerWithContainer,
} from "./banner/BannerOrchestrator.js";
import { Renderer } from "./rendering/Renderer.js";

/**
 * Invocation type classification
 */
type InvocationType = "banner" | "help" | "version" | "command";

/**
 * Classifies the CLI invocation type from process arguments.
 *
 * @param argv - Process arguments (process.argv)
 * @returns The invocation type
 */
function classifyInvocation(argv: string[]): InvocationType {
  // Bare 'jumbo' command shows banner
  if (isBareCommand(argv)) {
    return "banner";
  }

  // Check for explicit help (root level --help)
  const isExplicitHelp =
    (argv.includes("--help") || argv.includes("-h")) && argv.length === 3;
  if (isExplicitHelp) {
    return "help";
  }

  // Check for version request
  if (argv.includes("--version") || argv.includes("-v")) {
    return "version";
  }

  // Everything else is a command (including subcommand --help)
  return "command";
}

export class AppRunner {
  private readonly container: IApplicationContainer | null;
  private readonly version: string;

  /**
   * Creates a new AppRunner.
   *
   * @param version - CLI version string
   * @param container - Application container (optional, null for help/version without project)
   */
  constructor(version: string, container: IApplicationContainer | null = null) {
    this.version = version;
    this.container = container;
  }

  /**
   * Runs the CLI application.
   *
   * Classifies the invocation and routes to the appropriate handler.
   */
  async run(): Promise<void> {
    const argv = process.argv;
    const invocationType = classifyInvocation(argv);

    // Handle bare 'jumbo' command - show banner and exit
    if (invocationType === "banner") {
      await showBannerWithContainer(this.version, this.container);
      return; // showBannerWithContainer calls process.exit
    }

    // Create program with categorized help
    const program = createProgram(this.version, commands);
    attachGlobalOptions(program);

    // Handle explicit help (root --help)
    if (invocationType === "help") {
      const applicator = new CommanderApplicator();
      applicator.apply(program, commands);
      program.outputHelp();
      process.exit(0);
    }

    // Handle version request
    if (invocationType === "version") {
      const applicator = new CommanderApplicator();
      applicator.apply(program, commands);
      await program.parseAsync(argv);
      return;
    }

    // Handle command execution
    await this.executeCommand(program, argv);
  }

  /**
   * Executes a command with project validation.
   *
   * @param program - Configured Commander program
   * @param argv - Process arguments
   */
  private async executeCommand(
    program: ReturnType<typeof createProgram>,
    argv: string[]
  ): Promise<void> {
    const jumboRoot = path.join(process.cwd(), ".jumbo");

    // Check if this is a subcommand help request
    const isSubcommandHelp =
      (argv.includes("--help") || argv.includes("-h")) && argv.length > 3;

    // Validate project requirement using metadata
    const { requiresProject } = validateProjectRequirement(argv, commands);

    // Check project existence if required
    if (requiresProject && !isSubcommandHelp) {
      const projectExists = await fs.pathExists(jumboRoot);
      if (!projectExists) {
        const renderer = Renderer.getInstance();
        renderer.error("Project not initialized. Run 'jumbo project init' first.");
        process.exit(1);
      }
    }

    try {
      // Apply commands WITH container
      const applicator = new CommanderApplicator();
      applicator.apply(program, commands, this.container ?? undefined);

      // Parse and execute command
      await program.parseAsync(argv);
    } catch (error) {
      const renderer = Renderer.getInstance();
      renderer.error(
        "Command failed",
        error instanceof Error ? error : String(error)
      );
      process.exit(1);
    }
    // Note: No finally block needed for cleanup.
    // Host handles resource disposal via process signal handlers.
  }
}
