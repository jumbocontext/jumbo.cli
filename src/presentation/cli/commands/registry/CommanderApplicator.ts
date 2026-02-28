/**
 * Commander.js Applicator
 *
 * Applies framework-agnostic command metadata to Commander.js.
 * This is ONE adapter - future: InkApplicator for React TUI.
 */
import { Command, Option } from "commander";
import chalk from "chalk";
import { RegisteredCommand } from "./CommandMetadata.js";
import { IApplicationContainer } from "../../../../application/host/IApplicationContainer.js";
import { extractParts } from "./PathNormalizer.js";
import { Renderer } from "../../rendering/Renderer.js";
import { formatSubcommandHelp } from "../../help/SubcommandHelpFormatter.js";

/**
 * Applies registered commands to Commander.js
 */
export class CommanderApplicator {
  private parentCommands = new Map<string, Command>();
  private container?: IApplicationContainer;
  private program?: Command;

  apply(
    program: Command,
    commands: RegisteredCommand[],
    container?: IApplicationContainer
  ): void {
    this.container = container;
    this.program = program;
    const grouped = this.groupByParent(commands);

    for (const parent of grouped.keys()) {
      this.createParentCommand(program, parent);
    }

    for (const command of commands) {
      this.registerCommand(command);
      this.registerTopLevelAliases(command);
    }
  }

  private groupByParent(commands: RegisteredCommand[]): Map<string, RegisteredCommand[]> {
    const grouped = new Map<string, RegisteredCommand[]>();
    for (const command of commands) {
      const { parent } = extractParts(command.path);
      if (!grouped.has(parent)) {
        grouped.set(parent, []);
      }
      grouped.get(parent)?.push(command);
    }
    return grouped;
  }

  private createParentCommand(program: Command, parent: string): Command {
    if (!this.parentCommands.has(parent)) {
      const cmd = program.command(parent).description(`Manage ${parent} operations`);
      this.parentCommands.set(parent, cmd);
    }
    return this.parentCommands.get(parent)!;
  }

  private registerCommand(registeredCommand: RegisteredCommand): void {
    const { parent, subcommand } = extractParts(registeredCommand.path);
    const parentCmd = this.parentCommands.get(parent)!;

    // Create command with hidden option if marked
    const commandOptions = registeredCommand.metadata.hidden ? { hidden: true } : {};
    const cmd = parentCmd
      .command(subcommand, commandOptions)
      .description(registeredCommand.metadata.description);

    // Add options
    registeredCommand.metadata.requiredOptions?.forEach(opt => {
      if (opt.default !== undefined) {
        const defaultValue = typeof opt.default === "number" ? String(opt.default) : opt.default;
        cmd.requiredOption(opt.flags, chalk.gray(opt.description), defaultValue);
      } else {
        cmd.requiredOption(opt.flags, chalk.gray(opt.description));
      }
    });

    registeredCommand.metadata.options?.forEach(opt => {
      if (opt.hidden) {
        const option = new Option(opt.flags, chalk.gray(opt.description));
        if (opt.default !== undefined) {
          const defaultValue = typeof opt.default === "number" ? String(opt.default) : opt.default;
          option.default(defaultValue);
        }
        option.hideHelp();
        cmd.addOption(option);
      } else {
        if (opt.default !== undefined) {
          const defaultValue = typeof opt.default === "number" ? String(opt.default) : opt.default;
          cmd.option(opt.flags, chalk.gray(opt.description), defaultValue);
        } else {
          cmd.option(opt.flags, chalk.gray(opt.description));
        }
      }
    });

    // Override help to use gh-style formatting
    const capturedCommand = registeredCommand;
    cmd.helpInformation = function () {
      return formatSubcommandHelp(capturedCommand);
    };

    // Action handler with error handling and container injection
    cmd.action(async options => {
      try {
        // Inject container as second parameter if available
        await registeredCommand.handler(options, this.container);
      } catch (error) {
        const renderer = Renderer.getInstance();
        renderer.error("Command failed", error instanceof Error ? error : String(error));
        process.exit(1);
      }
    });
  }

  /**
   * Registers top-level aliases for a command
   * e.g., "init" as alias for "project init"
   */
  private registerTopLevelAliases(registeredCommand: RegisteredCommand): void {
    const aliases = registeredCommand.metadata.topLevelAliases;
    if (!aliases?.length || !this.program) return;

    const { parent, subcommand } = extractParts(registeredCommand.path);

    for (const alias of aliases) {
      const aliasOptions = registeredCommand.metadata.hidden ? { hidden: true } : {};
      const cmd = this.program
        .command(alias, aliasOptions)
        .description(
          `${registeredCommand.metadata.description} (alias for "${parent} ${subcommand}")`
        );

      // Add options (same as original command)
      registeredCommand.metadata.requiredOptions?.forEach(opt => {
        if (opt.default !== undefined) {
          const defaultValue = typeof opt.default === "number" ? String(opt.default) : opt.default;
          cmd.requiredOption(opt.flags, chalk.gray(opt.description), defaultValue);
        } else {
          cmd.requiredOption(opt.flags, chalk.gray(opt.description));
        }
      });

      registeredCommand.metadata.options?.forEach(opt => {
        if (opt.hidden) {
          const option = new Option(opt.flags, chalk.gray(opt.description));
          if (opt.default !== undefined) {
            const defaultValue = typeof opt.default === "number" ? String(opt.default) : opt.default;
            option.default(defaultValue);
          }
          option.hideHelp();
          cmd.addOption(option);
        } else {
          if (opt.default !== undefined) {
            const defaultValue = typeof opt.default === "number" ? String(opt.default) : opt.default;
            cmd.option(opt.flags, chalk.gray(opt.description), defaultValue);
          } else {
            cmd.option(opt.flags, chalk.gray(opt.description));
          }
        }
      });

      // Override help to use gh-style formatting with alias name
      const capturedForAlias = registeredCommand;
      const capturedAlias = alias;
      cmd.helpInformation = function () {
        return formatSubcommandHelp(capturedForAlias, capturedAlias);
      };

      // Same action handler
      cmd.action(async options => {
        try {
          await registeredCommand.handler(options, this.container);
        } catch (error) {
          const renderer = Renderer.getInstance();
          renderer.error("Command failed", error instanceof Error ? error : String(error));
          process.exit(1);
        }
      });
    }
  }
}
