/**
 * Infrastructure: GitHub Hooks Configurer
 *
 * Encapsulates all knowledge about GitHub hooks configuration:
 * - .github/hooks/hooks.json with SessionStart hooks
 *
 * Operations are idempotent and gracefully handle errors.
 */

import path from "path";
import fs from "fs-extra";
import { IConfigurer } from "./IConfigurer.js";
import { PlannedFileChange } from "../../../../application/context/project/init/PlannedFileChange.js";

export class GitHubHooksConfigurer implements IConfigurer {
  /**
   * Configure all GitHub hooks requirements for Jumbo
   *
   * @param projectRoot Absolute path to project root directory
   */
  async configure(projectRoot: string): Promise<void> {
    await this.ensureGitHubHooks(projectRoot);
  }

  /**
   * Ensure GitHub hooks are configured in .github/hooks/hooks.json
   */
  private async ensureGitHubHooks(projectRoot: string): Promise<void> {
    try {
      const hooksPath = path.join(projectRoot, ".github", "hooks", "hooks.json");
      
      // Ensure .github/hooks directory exists
      await fs.ensureDir(path.join(projectRoot, ".github", "hooks"));

      // Define all Jumbo hooks for GitHub
      const jumboHooks = {
        version: 1,
        hooks: {
          sessionStart: [
            {
              type: "command",
              bash: "jumbo session start",
              cwd: ".",
              timeoutSec: 10
            }
          ]
        }
      };

      // Check if file exists
      const exists = await fs.pathExists(hooksPath);

      if (!exists) {
        // File doesn't exist - create with full content
        await fs.writeFile(hooksPath, JSON.stringify(jumboHooks, null, 2) + "\n", "utf-8");
        return;
      }

      // File exists - merge with existing content
      const existingContent = await fs.readFile(hooksPath, "utf-8");
      let existingHooks = {};
      
      if (existingContent.trim()) {
        try {
          existingHooks = JSON.parse(existingContent);
        } catch (parseError) {
          // If JSON is malformed, overwrite with our content
          await fs.writeFile(hooksPath, JSON.stringify(jumboHooks, null, 2) + "\n", "utf-8");
          return;
        }
      }

      // Merge hooks - ensure sessionStart hooks are present
      const mergedHooks = this.mergeHooks(existingHooks, jumboHooks);
      
      await fs.writeFile(hooksPath, JSON.stringify(mergedHooks, null, 2) + "\n", "utf-8");
      
    } catch (error) {
      // Graceful degradation - log but don't throw
      console.warn(
        `Warning: Failed to configure GitHub hooks: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Merge hooks, preserving existing content and adding missing Jumbo hooks
   */
  private mergeHooks(existing: any, jumbo: any): any {
    const result = { ...existing };
    
    // Ensure version is set
    if (jumbo.version !== undefined) {
      result.version = jumbo.version;
    }
    
    // Merge hooks
    if (jumbo.hooks) {
      result.hooks = result.hooks ?? {};
      
      for (const [hookType, hooks] of Object.entries(jumbo.hooks)) {
        if (hooks && Array.isArray(hooks)) {
          const existingHooks = Array.isArray(result.hooks[hookType]) ? result.hooks[hookType] : [];
          result.hooks[hookType] = this.mergeHookArray(existingHooks, hooks);
        }
      }
    }
    
    return result;
  }

  /**
   * Merge hook arrays, deduplicating by command content
   */
  private mergeHookArray(existing: any[], additions: any[]): any[] {
    const merged = [...existing];
    const existingCommands = new Set(existing.map(h => JSON.stringify(h)));
    
    for (const addition of additions) {
      const additionKey = JSON.stringify(addition);
      if (!existingCommands.has(additionKey)) {
        merged.push(addition);
        existingCommands.add(additionKey);
      }
    }
    
    return merged;
  }

  /**
   * Return what changes this configurer will make without executing.
   */
  async getPlannedFileChanges(projectRoot: string): Promise<PlannedFileChange[]> {
    const hooksPath = path.join(projectRoot, ".github", "hooks", "hooks.json");

    return [
      {
        path: ".github/hooks/hooks.json",
        action: (await fs.pathExists(hooksPath)) ? "modify" : "create",
        description: "Add GitHub hooks configuration",
      },
    ];
  }
}