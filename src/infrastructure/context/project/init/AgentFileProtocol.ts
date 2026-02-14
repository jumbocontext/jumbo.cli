/**
 * Infrastructure: Agent File Protocol Implementation
 *
 * Orchestrates AI agent configuration during project initialization.
 * Delegates agent-specific logic to dedicated Configurer classes.
 *
 * Extension:
 * To add a new agent, create a *Configurer class that implements
 * IConfigurer interface, then add it to the configurers array below.
 * No changes to IAgentFileProtocol needed.
 *
 * Operations are idempotent and gracefully handle errors to avoid
 * failing project initialization if file writes fail.
 */

import path from "path";
import fs from "fs-extra";
import { IAgentFileProtocol } from "../../../../application/context/project/init/IAgentFileProtocol.js";
import { PlannedFileChange } from "../../../../application/context/project/init/PlannedFileChange.js";
import { AgentInstructions } from "../../../../domain/project/AgentInstructions.js";
import { IConfigurer } from "./IConfigurer.js";
import { ClaudeConfigurer } from "./ClaudeConfigurer.js";
import { GeminiConfigurer } from "./GeminiConfigurer.js";
import { CopilotConfigurer } from "./CopilotConfigurer.js";
import { GitHubHooksConfigurer } from "./GitHubHooksConfigurer.js";

export class AgentFileProtocol implements IAgentFileProtocol {
  private readonly configurers: IConfigurer[] = [
    new ClaudeConfigurer(),
    new GeminiConfigurer(),
    new CopilotConfigurer(),
    new GitHubHooksConfigurer(),
  ];

  /**
   * Ensure AGENTS.md exists with Jumbo instructions
   */
  async ensureAgentsMd(projectRoot: string): Promise<void> {
    const agentsMdPath = path.join(projectRoot, "AGENTS.md");

    try {
      const exists = await fs.pathExists(agentsMdPath);

      if (!exists) {
        // File doesn't exist - create with full content
        await fs.writeFile(agentsMdPath, AgentInstructions.getFullContent(), "utf-8");
        return;
      }

      // File exists - check if Jumbo section is present
      const content = await fs.readFile(agentsMdPath, "utf-8");
      const jumboMarker = AgentInstructions.getJumboSectionMarker();

      if (!content.includes(jumboMarker)) {
        // Jumbo section missing - append it
        const updatedContent = content + "\n\n" + AgentInstructions.getJumboSection();
        await fs.writeFile(agentsMdPath, updatedContent, "utf-8");
      }
      // else: Jumbo section already present - no-op
    } catch (error) {
      // Graceful degradation - log but don't throw
      console.warn(`Warning: Failed to update AGENTS.md: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Ensure all supported agents are configured for Jumbo
   */
  async ensureAgentConfigurations(projectRoot: string): Promise<void> {
    for (const configurer of this.configurers) {
      await configurer.configure(projectRoot);
    }
  }

  /**
   * Repair AGENTS.md by replacing the Jumbo section with the current version
   */
  async repairAgentsMd(projectRoot: string): Promise<void> {
    const agentsMdPath = path.join(projectRoot, "AGENTS.md");

    try {
      const exists = await fs.pathExists(agentsMdPath);

      if (!exists) {
        // File doesn't exist - create with full content (same as ensure)
        await fs.writeFile(agentsMdPath, AgentInstructions.getFullContent(), "utf-8");
        return;
      }

      const content = await fs.readFile(agentsMdPath, "utf-8");
      const replaced = AgentInstructions.replaceJumboSection(content);

      if (replaced !== null) {
        // Jumbo section found - replace with current version
        await fs.writeFile(agentsMdPath, replaced, "utf-8");
      } else {
        // Jumbo section not found - append (same as ensure)
        const updatedContent = content + "\n\n" + AgentInstructions.getJumboSection();
        await fs.writeFile(agentsMdPath, updatedContent, "utf-8");
      }
    } catch (error) {
      console.warn(`Warning: Failed to repair AGENTS.md: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Repair all supported agent configurations
   */
  async repairAgentConfigurations(projectRoot: string): Promise<void> {
    for (const configurer of this.configurers) {
      if (configurer.repair) {
        await configurer.repair(projectRoot);
      } else {
        await configurer.configure(projectRoot);
      }
    }
  }

  /**
   * Get all planned file changes without executing.
   */
  async getPlannedFileChanges(projectRoot: string): Promise<PlannedFileChange[]> {
    const changes: PlannedFileChange[] = [];

    // AGENTS.md change
    const agentsMdPath = path.join(projectRoot, "AGENTS.md");
    changes.push({
      path: "AGENTS.md",
      action: (await fs.pathExists(agentsMdPath)) ? "modify" : "create",
      description: "Add Jumbo instructions",
    });

    // Collect from all configurers
    for (const configurer of this.configurers) {
      const configurerChanges = await configurer.getPlannedFileChanges(projectRoot);
      changes.push(...configurerChanges);
    }

    return changes;
  }
}
