/**
 * CLI Command: jumbo repair
 *
 * Re-injects current-version agent configuration files and optionally
 * rebuilds the database. Use after upgrading Jumbo CLI to bring
 * AGENTS.md, CLAUDE.md, GEMINI.md, copilot-instructions.md, and
 * settings files up to date.
 */

import { CommandMetadata } from "../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../rendering/Renderer.js";
import { RepairOutputBuilder } from "./RepairOutputBuilder.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Repair agent configuration files and optionally rebuild the database",
  options: [
    {
      flags: "--yes",
      description: "Skip confirmation prompt",
    },
    {
      flags: "--no-agents",
      description: "Skip agent file repair (AGENTS.md, CLAUDE.md, GEMINI.md, etc.)",
    },
    {
      flags: "--no-settings",
      description: "Skip settings file repair",
    },
    {
      flags: "--no-db",
      description: "Skip database rebuild",
    },
  ],
  examples: [
    {
      command: "jumbo repair --yes",
      description: "Repair all configuration files and rebuild database",
    },
    {
      command: "jumbo repair --yes --no-db",
      description: "Repair configuration files only (skip database rebuild)",
    },
    {
      command: "jumbo repair --yes --no-agents --no-settings",
      description: "Only rebuild the database",
    },
  ],
  related: ["db rebuild", "project init"],
};

interface RepairOptions {
  yes?: boolean;
  agents?: boolean;
  settings?: boolean;
  db?: boolean;
}

/**
 * Command handler
 * Called by Commander with parsed options
 */
export async function repair(options: RepairOptions, container: IApplicationContainer) {
  const renderer = Renderer.getInstance();
  const outputBuilder = new RepairOutputBuilder();

  try {
    // Confirm operation
    if (!options.yes) {
      const output = outputBuilder.buildConfirmationRequired();
      renderer.info(output.toHumanReadable());
      process.exit(1);
    }

    // Commander inverts --no-X flags: --no-agents sets options.agents = false
    const response = await container.repairController.handle({
      doAgents: options.agents !== false,
      doSettings: options.settings !== false,
      doDb: options.db !== false,
    });

    // Render results
    const output = outputBuilder.buildSuccess(response.steps);
    renderer.info(output.toHumanReadable());
  } catch (error) {
    const output = outputBuilder.buildFailureError(error instanceof Error ? error : String(error));
    renderer.info(output.toHumanReadable());
    process.exit(1);
  }
}
