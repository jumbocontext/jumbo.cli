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

import { IApplicationContainer } from "../../application/host/IApplicationContainer.js";
import { commands } from "./commands/registry/generated-commands.js";
import { CommanderApplicator } from "./commands/registry/CommanderApplicator.js";
import { createProgram } from "./program/ProgramFactory.js";
import { attachGlobalOptions } from "./program/GlobalOptionsHandler.js";
import { classifyCommand } from "./commands/CommandClassifier.js";
import {
  isBareCommand,
  showBannerWithContainer,
} from "./banner/BannerOrchestrator.js";
import { Renderer } from "./rendering/Renderer.js";
import { CLI_FLAGS, ARGV } from "./Constants.js";

/**
 * Invocation type classification
 */
type InvocationType = "banner" | "help" | "version" | "command";

const CLI_COMMAND_EXECUTED_EVENT = "cli_command_executed";
const PROCESS_EXIT_ERROR_TYPE = "ProcessExit";
const SUCCESS_EXIT_CODE = 0;
const FAILURE_EXIT_CODE = 1;

class ProcessExitSignal {
  readonly exitCode: number;

  constructor(code?: string | number | null) {
    this.exitCode = ProcessExitSignal.normalizeExitCode(code);
  }

  private static normalizeExitCode(code?: string | number | null): number {
    if (typeof code === "number" && Number.isFinite(code)) {
      return code;
    }

    if (typeof code === "string") {
      const parsed = Number.parseInt(code, 10);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }

    return SUCCESS_EXIT_CODE;
  }
}

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
    (argv.includes(CLI_FLAGS.HELP_LONG) ||
      argv.includes(CLI_FLAGS.HELP_SHORT)) &&
    argv.length === ARGV.ROOT_COMMAND_ARG_COUNT;
  if (isExplicitHelp) {
    return "help";
  }

  // Check for version request
  if (
    argv.includes(CLI_FLAGS.VERSION_LONG) ||
    argv.includes(CLI_FLAGS.VERSION_SHORT)
  ) {
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
    // Check if this is a subcommand help request
    const isSubcommandHelp =
      (argv.includes(CLI_FLAGS.HELP_LONG) ||
        argv.includes(CLI_FLAGS.HELP_SHORT)) &&
      argv.length > ARGV.ROOT_COMMAND_ARG_COUNT;

    // Classify command to determine project requirement using metadata
    const classification = classifyCommand(argv, commands);

    // Check project existence if required
    if (classification.requiresProject && !isSubcommandHelp) {
      if (!this.container) {
        const renderer = Renderer.getInstance();
        renderer.error(
          "No Jumbo project found. Run `jumbo project init` from your project root."
        );
        process.exit(FAILURE_EXIT_CODE);
      }
    }

    const commandName = this.resolveTelemetryCommandName(
      argv,
      classification.commandPath
    );

    await this.executeCommandWithTelemetry(commandName, async () => {
      const applicator = new CommanderApplicator();
      applicator.apply(program, commands, this.container ?? undefined);
      await program.parseAsync(argv);
    });
  }

  private async executeCommandWithTelemetry(
    commandName: string,
    execute: () => Promise<void>
  ): Promise<void> {
    const startedAt = process.hrtime.bigint();
    const originalProcessExit = process.exit.bind(process);
    process.exit = ((code?: string | number | null): never => {
      throw new ProcessExitSignal(code);
    }) as typeof process.exit;

    try {
      await execute();
      this.trackCommandTelemetry(commandName, startedAt, true);
    } catch (error) {
      if (error instanceof ProcessExitSignal) {
        this.trackCommandTelemetry(
          commandName,
          startedAt,
          error.exitCode === SUCCESS_EXIT_CODE,
          error.exitCode === SUCCESS_EXIT_CODE ? undefined : PROCESS_EXIT_ERROR_TYPE
        );

        await this.shutdownTelemetryClient();
        originalProcessExit(error.exitCode);
      }

      this.trackCommandTelemetry(
        commandName,
        startedAt,
        false,
        this.resolveErrorType(error)
      );

      const renderer = Renderer.getInstance();
      renderer.error(
        "Command failed",
        error instanceof Error ? error : String(error)
      );

      await this.shutdownTelemetryClient();
      originalProcessExit(FAILURE_EXIT_CODE);
    } finally {
      process.exit = originalProcessExit as typeof process.exit;
    }
  }

  private resolveTelemetryCommandName(
    argv: string[],
    classifiedCommandPath: string | null
  ): string {
    if (classifiedCommandPath !== null) {
      return classifiedCommandPath;
    }

    const positionalArgs = argv
      .slice(ARGV.COMMAND_START_INDEX)
      .filter((arg) => !arg.startsWith(CLI_FLAGS.FLAG_PREFIX));

    return positionalArgs.slice(0, 2).join(" ") || "unknown";
  }

  private trackCommandTelemetry(
    commandName: string,
    startedAt: bigint,
    success: boolean,
    errorType?: string
  ): void {
    if (!this.container) {
      return;
    }
    const durationMs = Number(
      (process.hrtime.bigint() - startedAt) / BigInt(1_000_000)
    );

    this.container.telemetryClient.track(CLI_COMMAND_EXECUTED_EVENT, {
      commandName,
      cliVersion: this.version,
      nodeVersion: process.version,
      osPlatform: process.platform,
      osArch: process.arch,
      success,
      durationMs,
      ...(errorType ? { errorType } : {}),
    });
  }

  private resolveErrorType(error: unknown): string {
    if (error instanceof Error && error.name.length > 0) {
      return error.name;
    }

    return "UnknownError";
  }

  private async shutdownTelemetryClient(): Promise<void> {
    if (!this.container) {
      return;
    }

    try {
      await this.container.telemetryClient.shutdown();
    } catch {
      // Telemetry must never affect command termination.
    }
  }
}
