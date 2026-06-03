/**
 * Infrastructure: Gemini CLI Configurer
 *
 * Encapsulates all knowledge about Gemini CLI configuration:
 * - GEMINI.md with thin reference to JUMBO.md
 * - .gemini/settings.json with SessionStart hooks
 *
 * Operations are idempotent and gracefully handle errors.
 */

import path from "path";
import fs from "fs-extra";
import { AgentFileReferenceContent } from "../../../../domain/project/AgentFileReferenceContent.js";
import { AgentFileAssetContent } from "../../../../domain/project/AgentFileAssetContent.js";
import { SafeGeminiSettingsMerger } from "./SafeGeminiSettingsMerger.js";
import { IConfigurer } from "./IConfigurer.js";
import { PlannedFileChange } from "../../../../application/context/project/init/PlannedFileChange.js";

export class GeminiConfigurer implements IConfigurer {
  readonly agent = {
    id: "gemini",
    name: "Gemini",
  } as const;

  readonly skillPlatforms = [".gemini/skills"] as const;

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
   * Ensure GEMINI.md exists with thin reference to JUMBO.md
   */
  private async ensureGeminiMd(projectRoot: string): Promise<void> {
    const geminiMdPath = path.join(projectRoot, "GEMINI.md");
    const reference = AgentFileReferenceContent.getAgentFileReference("GEMINI.md");

    try {
      const exists = await fs.pathExists(geminiMdPath);

      if (!exists) {
        await fs.writeFile(geminiMdPath, reference, "utf-8");
        return;
      }

      // File exists - check if reference is present
      const content = await fs.readFile(geminiMdPath, "utf-8");

      if (!content.includes("JUMBO.md")) {
        // Reference missing - append it
        const updatedContent = content.trimEnd() + "\n\n" + reference;
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
      const jumboSettings = AgentFileAssetContent.readJson("gemini-settings.fragment.json");

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
   * Repair GEMINI.md by replacing the reference with the current thin reference
   */
  private async repairGeminiMd(projectRoot: string): Promise<void> {
    const geminiMdPath = path.join(projectRoot, "GEMINI.md");
    const reference = AgentFileReferenceContent.getAgentFileReference("GEMINI.md");

    try {
      const exists = await fs.pathExists(geminiMdPath);

      if (!exists) {
        await fs.writeFile(geminiMdPath, reference, "utf-8");
        return;
      }

      const content = await fs.readFile(geminiMdPath, "utf-8");
      const replaced = AgentFileReferenceContent.replaceAgentFileReference(content, "GEMINI.md");

      if (replaced !== null) {
        // Legacy reference block found - replace entire file with new thin reference
        await fs.writeFile(geminiMdPath, replaced, "utf-8");
      } else if (!content.includes("JUMBO.md")) {
        // No reference at all - append
        const updatedContent = content.trimEnd() + "\n\n" + reference;
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
