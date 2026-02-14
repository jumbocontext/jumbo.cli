/**
 * Infrastructure: Gemini CLI Configurer
 *
 * Encapsulates all knowledge about Gemini CLI configuration:
 * - GEMINI.md with reference to AGENTS.md
 * - .gemini/settings.json with SessionStart hooks
 *
 * Operations are idempotent and gracefully handle errors.
 */

import path from "path";
import fs from "fs-extra";
import { AgentInstructions } from "../../../../domain/project/AgentInstructions.js";
import { SafeGeminiSettingsMerger } from "./SafeGeminiSettingsMerger.js";
import { IConfigurer } from "./IConfigurer.js";
import { PlannedFileChange } from "../../../../application/context/project/init/PlannedFileChange.js";

export class GeminiConfigurer implements IConfigurer {
  /**
   * Configure all Gemini CLI requirements for Jumbo
   *
   * @param projectRoot Absolute path to project root directory
   */
  async configure(projectRoot: string): Promise<void> {
    await this.ensureGeminiMd(projectRoot);
    await this.ensureGeminiSettings(projectRoot);
  }

  /**
   * Ensure GEMINI.md exists with reference to AGENTS.md
   */
  private async ensureGeminiMd(projectRoot: string): Promise<void> {
    const geminiMdPath = path.join(projectRoot, "GEMINI.md");
    const reference = AgentInstructions.getAgentFileReference();

    try {
      const exists = await fs.pathExists(geminiMdPath);

      if (!exists) {
        // File doesn't exist - create with reference
        await fs.writeFile(geminiMdPath, reference.trim() + "\n", "utf-8");
        return;
      }

      // File exists - check if reference is present
      const content = await fs.readFile(geminiMdPath, "utf-8");

      if (!content.includes("AGENTS.md")) {
        // Reference missing - append it
        const updatedContent = content.trimEnd() + "\n" + reference;
        await fs.writeFile(geminiMdPath, updatedContent, "utf-8");
      }
      // else: Reference already present - no-op
    } catch (error) {
      // Graceful degradation - log but don't throw
      console.warn(
        `Warning: Failed to update GEMINI.md: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Ensure Gemini CLI hooks are configured in .gemini/settings.json
   */
  private async ensureGeminiSettings(projectRoot: string): Promise<void> {
    try {
      // Define all Jumbo settings for Gemini CLI
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
              matcher: "compress" as const,
              hooks: [
                {
                  type: "command" as const,
                  command: "jumbo work resume",
                },
              ],
            },
          ],
          PreCompress: [
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
        tools: {
          allowed: ["run_shell_command(jumbo --help)"],
        },
      };

      // Merge into existing settings (or create new)
      await SafeGeminiSettingsMerger.mergeSettings(projectRoot, jumboSettings);
    } catch (error) {
      // Graceful degradation - log but don't throw
      console.warn(
        `Warning: Failed to configure Gemini CLI hooks: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Repair Gemini CLI configuration by replacing stale content
   */
  async repair(projectRoot: string): Promise<void> {
    await this.repairGeminiMd(projectRoot);
    await this.ensureGeminiSettings(projectRoot);
  }

  /**
   * Repair GEMINI.md by replacing the reference block with the current version
   */
  private async repairGeminiMd(projectRoot: string): Promise<void> {
    const geminiMdPath = path.join(projectRoot, "GEMINI.md");
    const reference = AgentInstructions.getAgentFileReference();

    try {
      const exists = await fs.pathExists(geminiMdPath);

      if (!exists) {
        await fs.writeFile(geminiMdPath, reference.trim() + "\n", "utf-8");
        return;
      }

      const content = await fs.readFile(geminiMdPath, "utf-8");
      const replaced = AgentInstructions.replaceAgentFileReference(content);

      if (replaced !== null) {
        // Reference block found - replace with current version
        await fs.writeFile(geminiMdPath, replaced, "utf-8");
      } else if (!content.includes("AGENTS.md")) {
        // No reference at all - append
        const updatedContent = content.trimEnd() + "\n" + reference;
        await fs.writeFile(geminiMdPath, updatedContent, "utf-8");
      }
    } catch (error) {
      console.warn(
        `Warning: Failed to repair GEMINI.md: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Return what changes this configurer will make without executing.
   */
  async getPlannedFileChanges(projectRoot: string): Promise<PlannedFileChange[]> {
    const changes: PlannedFileChange[] = [];

    const geminiMdPath = path.join(projectRoot, "GEMINI.md");
    changes.push({
      path: "GEMINI.md",
      action: (await fs.pathExists(geminiMdPath)) ? "modify" : "create",
      description: "Add Jumbo instructions",
    });

    const settingsPath = path.join(projectRoot, ".gemini/settings.json");
    changes.push({
      path: ".gemini/settings.json",
      action: (await fs.pathExists(settingsPath)) ? "modify" : "create",
      description: "Add hook configuration and permissions",
    });

    return changes;
  }
}
