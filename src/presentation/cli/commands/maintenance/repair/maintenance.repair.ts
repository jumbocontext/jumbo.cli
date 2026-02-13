/**
 * CLI Command: jumbo maintenance repair (aliased as jumbo repair)
 *
 * Re-injects current-version agent configuration files and optionally
 * rebuilds the database. Use after upgrading Jumbo CLI to bring
 * AGENTS.md, CLAUDE.md, GEMINI.md, copilot-instructions.md, and
 * settings files up to date.
 */

import fs from "fs-extra";
import path from "path";
import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { RepairOutputBuilder, RepairStepResult } from "./RepairOutputBuilder.js";

/**
 * Command metadata for auto-registration
 */
export const metadata: CommandMetadata = {
  description: "Repair agent configuration files and optionally rebuild the database",
  topLevelAliases: ["repair"],
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
export async function maintenanceRepair(options: RepairOptions, container: IApplicationContainer) {
  const renderer = Renderer.getInstance();
  const outputBuilder = new RepairOutputBuilder();

  try {
    // Check if Jumbo is initialized
    const jumboRoot = path.join(process.cwd(), ".jumbo");
    if (!(await fs.pathExists(jumboRoot))) {
      renderer.error("Not in a Jumbo project", "Run 'jumbo project init' first");
      process.exit(1);
    }

    // Confirm operation
    if (!options.yes) {
      const output = outputBuilder.buildConfirmationRequired();
      renderer.info(output.toHumanReadable());
      process.exit(1);
    }

    const projectRoot = process.cwd();
    const steps: RepairStepResult[] = [];

    // Commander inverts --no-X flags: --no-agents sets options.agents = false
    const doAgents = options.agents !== false;
    const doSettings = options.settings !== false;
    const doDb = options.db !== false;

    // Step 1: Repair AGENTS.md
    if (doAgents) {
      try {
        await container.agentFileProtocol.repairAgentsMd(projectRoot);
        steps.push({ name: "AGENTS.md", status: "repaired" });
      } catch (error) {
        steps.push({
          name: "AGENTS.md",
          status: "failed",
          detail: error instanceof Error ? error.message : String(error),
        });
      }
    } else {
      steps.push({ name: "AGENTS.md", status: "skipped" });
    }

    // Step 2: Repair agent configurations (CLAUDE.md, GEMINI.md, copilot, hooks, settings)
    if (doAgents) {
      try {
        await container.agentFileProtocol.repairAgentConfigurations(projectRoot);
        steps.push({ name: "Agent configurations", status: "repaired" });
      } catch (error) {
        steps.push({
          name: "Agent configurations",
          status: "failed",
          detail: error instanceof Error ? error.message : String(error),
        });
      }
    } else {
      steps.push({ name: "Agent configurations", status: "skipped" });
    }

    // Step 3: Ensure settings.jsonc
    if (doSettings) {
      try {
        await container.settingsInitializer.ensureSettingsFileExists();
        steps.push({ name: "Settings", status: "repaired" });
      } catch (error) {
        steps.push({
          name: "Settings",
          status: "failed",
          detail: error instanceof Error ? error.message : String(error),
        });
      }
    } else {
      steps.push({ name: "Settings", status: "skipped" });
    }

    // Step 4: Rebuild database
    if (doDb) {
      try {
        const result = await container.databaseRebuildService.rebuild();
        steps.push({
          name: "Database",
          status: "repaired",
          detail: `${result.eventsReplayed} events replayed`,
        });
      } catch (error) {
        steps.push({
          name: "Database",
          status: "failed",
          detail: error instanceof Error ? error.message : String(error),
        });
      }
    } else {
      steps.push({ name: "Database", status: "skipped" });
    }

    // Render results
    const output = outputBuilder.buildSuccess(steps);
    renderer.info(output.toHumanReadable());
  } catch (error) {
    const output = outputBuilder.buildFailureError(error instanceof Error ? error : String(error));
    renderer.info(output.toHumanReadable());
    process.exit(1);
  }
}
