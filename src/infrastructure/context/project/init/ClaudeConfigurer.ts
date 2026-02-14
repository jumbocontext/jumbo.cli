/**
 * Infrastructure: Claude Code Configurer
 *
 * Encapsulates all knowledge about Claude Code configuration:
 * - CLAUDE.md with reference to AGENTS.md
 * - .claude/settings.json with SessionStart hooks
 *
 * Use this as a reference when creating new agent Configurers.
 * Each Configurer implements IConfigurer interface.
 *
 * Operations are idempotent and gracefully handle errors.
 */

import path from "path";
import fs from "fs-extra";
import { AgentInstructions } from "../../../../domain/project/AgentInstructions.js";
import { SafeClaudeSettingsMerger } from "./SafeClaudeSettingsMerger.js";
import { IConfigurer } from "./IConfigurer.js";
import { PlannedFileChange } from "../../../../application/context/project/init/PlannedFileChange.js";

export class ClaudeConfigurer implements IConfigurer {
  /**
   * Configure all Claude Code requirements for Jumbo
   *
   * @param projectRoot Absolute path to project root directory
   */
  async configure(projectRoot: string): Promise<void> {
    await this.ensureClaudeMd(projectRoot);
    await this.ensureClaudeSettings(projectRoot);
  }

  /**
   * Ensure CLAUDE.md exists with reference to AGENTS.md
   */
  private async ensureClaudeMd(projectRoot: string): Promise<void> {
    const claudeMdPath = path.join(projectRoot, "CLAUDE.md");
    const reference = AgentInstructions.getAgentFileReference();

    try {
      const exists = await fs.pathExists(claudeMdPath);

      if (!exists) {
        // File doesn't exist - create with reference
        await fs.writeFile(claudeMdPath, reference.trim() + "\n", "utf-8");
        return;
      }

      // File exists - check if reference is present
      const content = await fs.readFile(claudeMdPath, "utf-8");

      if (!content.includes("AGENTS.md")) {
        // Reference missing - append it
        const updatedContent = content.trimEnd() + "\n" + reference;
        await fs.writeFile(claudeMdPath, updatedContent, "utf-8");
      }
      // else: Reference already present - no-op
    } catch (error) {
      // Graceful degradation - log but don't throw
      console.warn(
        `Warning: Failed to update CLAUDE.md: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Ensure Claude Code hooks are configured in .claude/settings.json
   */
  private async ensureClaudeSettings(projectRoot: string): Promise<void> {
    try {
      // Define all Jumbo settings for Claude Code
      const jumboSettings = {
        hooks: {
          SessionStart: [
            {
              matcher: "startup" as const,
              hooks: [
                {
                  type: "command" as const,
                  command: "jumbo session start",
                },
              ],
            },
            {
              matcher: "compact" as const,
              hooks: [
                {
                  type: "command" as const,
                  command: "jumbo work resume",
                },
              ],
            },
          ],
          PreCompact: [
            {
              matcher: "auto" as const,
              hooks: [
                {
                  type: "command" as const,
                  command: "jumbo work pause",
                },
              ],
            },
          ],
          SessionEnd: [
            {
              matcher: "exit" as const,
              hooks: [
                {
                  type: "command" as const,
                  command: "jumbo session end --focus {focus} --summary {summary}",
                },
              ],
            },
          ],
        },
        permissions: {
          allow: ["Bash(jumbo --help)"],
        },
      };

      // Merge into existing settings (or create new)
      await SafeClaudeSettingsMerger.mergeSettings(projectRoot, jumboSettings);
    } catch (error) {
      // Graceful degradation - log but don't throw
      console.warn(
        `Warning: Failed to configure Claude Code hooks: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Repair Claude Code configuration by replacing stale content
   */
  async repair(projectRoot: string): Promise<void> {
    await this.repairClaudeMd(projectRoot);
    await this.ensureClaudeSettings(projectRoot);
  }

  /**
   * Repair CLAUDE.md by replacing the reference block with the current version
   */
  private async repairClaudeMd(projectRoot: string): Promise<void> {
    const claudeMdPath = path.join(projectRoot, "CLAUDE.md");
    const reference = AgentInstructions.getAgentFileReference();

    try {
      const exists = await fs.pathExists(claudeMdPath);

      if (!exists) {
        await fs.writeFile(claudeMdPath, reference.trim() + "\n", "utf-8");
        return;
      }

      const content = await fs.readFile(claudeMdPath, "utf-8");
      const replaced = AgentInstructions.replaceAgentFileReference(content);

      if (replaced !== null) {
        // Reference block found - replace with current version
        await fs.writeFile(claudeMdPath, replaced, "utf-8");
      } else if (!content.includes("AGENTS.md")) {
        // No reference at all - append
        const updatedContent = content.trimEnd() + "\n" + reference;
        await fs.writeFile(claudeMdPath, updatedContent, "utf-8");
      }
    } catch (error) {
      console.warn(
        `Warning: Failed to repair CLAUDE.md: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Return what changes this configurer will make without executing.
   */
  async getPlannedFileChanges(projectRoot: string): Promise<PlannedFileChange[]> {
    const changes: PlannedFileChange[] = [];

    const claudeMdPath = path.join(projectRoot, "CLAUDE.md");
    changes.push({
      path: "CLAUDE.md",
      action: (await fs.pathExists(claudeMdPath)) ? "modify" : "create",
      description: "Add Jumbo instructions",
    });

    const settingsPath = path.join(projectRoot, ".claude/settings.json");
    changes.push({
      path: ".claude/settings.json",
      action: (await fs.pathExists(settingsPath)) ? "modify" : "create",
      description: "Add hook configuration and permissions",
    });

    return changes;
  }
}
