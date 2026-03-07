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
import { AgentsMdContent } from "../../../../domain/project/AgentsMdContent.js";
import { IConfigurer } from "./IConfigurer.js";
import { ClaudeConfigurer } from "./ClaudeConfigurer.js";
import { GeminiConfigurer } from "./GeminiConfigurer.js";
import { CopilotConfigurer } from "./CopilotConfigurer.js";
import { GitHubHooksConfigurer } from "./GitHubHooksConfigurer.js";

interface SkillPlatformConfiguration {
  readonly platformId: string;
  readonly skillsDirectoryRelativePath: string;
}

const DEFAULT_TEMPLATE_SKILLS_ROOT = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "..",
  "templates",
  "skills"
);

const SKILL_PLATFORM_CONFIGURATIONS: SkillPlatformConfiguration[] = [
  { platformId: "agents", skillsDirectoryRelativePath: path.join(".agents", "skills") },
  { platformId: "claude", skillsDirectoryRelativePath: path.join(".claude", "skills") },
  { platformId: "gemini", skillsDirectoryRelativePath: path.join(".gemini", "skills") },
  { platformId: "vibe", skillsDirectoryRelativePath: path.join(".vibe", "skills") },
];

export class AgentFileProtocol implements IAgentFileProtocol {
  private readonly configurers: IConfigurer[] = [
    new ClaudeConfigurer(),
    new GeminiConfigurer(),
    new CopilotConfigurer(),
    new GitHubHooksConfigurer(),
  ];

  constructor(private readonly templateSkillsRoot: string = DEFAULT_TEMPLATE_SKILLS_ROOT) {}

  /**
   * Ensure AGENTS.md exists with Jumbo instructions
   */
  async ensureAgentsMd(projectRoot: string): Promise<void> {
    const agentsMdPath = path.join(projectRoot, "AGENTS.md");

    try {
      const exists = await fs.pathExists(agentsMdPath);

      if (!exists) {
        // File doesn't exist - create with full content
        await fs.writeFile(agentsMdPath, AgentsMdContent.getFullContent(), "utf-8");
        return;
      }

      // File exists - try to replace existing Jumbo section (current or legacy markers)
      const content = await fs.readFile(agentsMdPath, "utf-8");
      const replaced = AgentsMdContent.replaceJumboSection(content);

      if (replaced !== null) {
        // Jumbo section found (current or legacy) - replace with current version
        await fs.writeFile(agentsMdPath, replaced, "utf-8");
      } else {
        // No Jumbo section found - append it
        const updatedContent = content + "\n\n" + AgentsMdContent.getJumboSection();
        await fs.writeFile(agentsMdPath, updatedContent, "utf-8");
      }
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

    await this.installSkillsFromTemplates(projectRoot);
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
        await fs.writeFile(agentsMdPath, AgentsMdContent.getFullContent(), "utf-8");
        return;
      }

      const content = await fs.readFile(agentsMdPath, "utf-8");
      const replaced = AgentsMdContent.replaceJumboSection(content);

      if (replaced !== null) {
        // Jumbo section found - replace with current version
        await fs.writeFile(agentsMdPath, replaced, "utf-8");
      } else {
        // Jumbo section not found - append (same as ensure)
        const updatedContent = content + "\n\n" + AgentsMdContent.getJumboSection();
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

    await this.repairSkillsFromTemplates(projectRoot);
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

    const skillChanges = await this.getSkillPlannedFileChanges(projectRoot);
    changes.push(...skillChanges);

    return changes;
  }

  private async installSkillsFromTemplates(projectRoot: string): Promise<void> {
    const templateSkillNames = await this.getTemplateSkillNames();
    if (templateSkillNames.length === 0) {
      return;
    }

    for (const platformConfiguration of SKILL_PLATFORM_CONFIGURATIONS) {
      const platformSkillsRoot = path.join(
        projectRoot,
        platformConfiguration.skillsDirectoryRelativePath
      );
      await fs.ensureDir(platformSkillsRoot);

      for (const skillName of templateSkillNames) {
        const sourceSkillDirectory = path.join(this.templateSkillsRoot, skillName);
        const destinationSkillDirectory = path.join(platformSkillsRoot, skillName);

        try {
          await fs.copy(sourceSkillDirectory, destinationSkillDirectory, {
            overwrite: false,
            errorOnExist: false,
          });
        } catch (error) {
          console.warn(
            `Warning: Failed to install template skill '${skillName}' for ${platformConfiguration.platformId}: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
      }
    }
  }

  private async repairSkillsFromTemplates(projectRoot: string): Promise<void> {
    const templateSkillNames = await this.getTemplateSkillNames();
    if (templateSkillNames.length === 0) {
      return;
    }

    for (const platformConfiguration of SKILL_PLATFORM_CONFIGURATIONS) {
      const platformSkillsRoot = path.join(
        projectRoot,
        platformConfiguration.skillsDirectoryRelativePath
      );
      await fs.ensureDir(platformSkillsRoot);

      for (const skillName of templateSkillNames) {
        const sourceSkillDirectory = path.join(this.templateSkillsRoot, skillName);
        const destinationSkillDirectory = path.join(platformSkillsRoot, skillName);

        try {
          await fs.remove(destinationSkillDirectory);
          await fs.copy(sourceSkillDirectory, destinationSkillDirectory, {
            overwrite: true,
            errorOnExist: false,
          });
        } catch (error) {
          console.warn(
            `Warning: Failed to repair template skill '${skillName}' for ${platformConfiguration.platformId}: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
      }
    }
  }

  private async getSkillPlannedFileChanges(projectRoot: string): Promise<PlannedFileChange[]> {
    const templateSkillNames = await this.getTemplateSkillNames();
    if (templateSkillNames.length === 0) {
      return [];
    }

    const changes: PlannedFileChange[] = [];
    for (const platformConfiguration of SKILL_PLATFORM_CONFIGURATIONS) {
      for (const skillName of templateSkillNames) {
        const destinationSkillDirectory = path.join(
          projectRoot,
          platformConfiguration.skillsDirectoryRelativePath,
          skillName
        );
        const exists = await fs.pathExists(destinationSkillDirectory);
        changes.push({
          path: path
            .join(platformConfiguration.skillsDirectoryRelativePath, skillName)
            .replace(/\\/g, "/"),
          action: exists ? "modify" : "create",
          description:
            "Sync Jumbo-managed skill from templates/skills (user-created skills are preserved)",
        });
      }
    }

    return changes;
  }

  private async getTemplateSkillNames(): Promise<string[]> {
    const exists = await fs.pathExists(this.templateSkillsRoot);
    if (!exists) {
      return [];
    }

    const entries = await fs.readdir(this.templateSkillsRoot, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort((left, right) => left.localeCompare(right));
  }
}
