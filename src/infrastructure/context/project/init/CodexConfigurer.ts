/**
 * Infrastructure: OpenAI Codex Configurer
 *
 * Encapsulates all knowledge about OpenAI Codex configuration:
 * - .codex/hooks.json with Codex lifecycle hooks
 * - Skills distributed to .codex/skills
 *
 * Codex reads AGENTS.md natively, so no instruction file is needed.
 * Codex hooks parse JSON stdout as hook-control envelopes, so Jumbo
 * lifecycle commands use text output to avoid parser conflicts.
 *
 * Operations are idempotent and gracefully handle errors.
 */

import path from "path";
import fs from "fs-extra";
import { IConfigurer } from "./IConfigurer.js";
import { PlannedFileChange } from "../../../../application/context/project/init/PlannedFileChange.js";
import { AgentFileAssetContent } from "../../../../domain/project/AgentFileAssetContent.js";

export class CodexConfigurer implements IConfigurer {
  readonly agent = {
    id: "codex",
    name: "Codex",
  } as const;

  readonly skillPlatforms = [".codex/skills"] as const;

  /**
   * Configure all OpenAI Codex requirements for Jumbo.
   * Codex reads AGENTS.md natively; lifecycle hooks are configured
   * separately in .codex/hooks.json.
   *
   * @param projectRoot Absolute path to project root directory
   */
  async configure(projectRoot: string): Promise<void> {
    await this.ensureCodexHooks(projectRoot);
  }

  /**
   * Repair Codex configuration by replacing stale Jumbo hook commands.
   */
  async repair(projectRoot: string): Promise<void> {
    await this.ensureCodexHooks(projectRoot);
  }

  private async ensureCodexHooks(projectRoot: string): Promise<void> {
    try {
      const hooksPath = path.join(projectRoot, ".codex", "hooks.json");
      await fs.ensureDir(path.join(projectRoot, ".codex"));

      const exists = await fs.pathExists(hooksPath);
      if (!exists) {
        await fs.writeFile(hooksPath, JSON.stringify(this.getJumboHooks(), null, 2) + "\n", "utf-8");
        return;
      }

      const existingContent = await fs.readFile(hooksPath, "utf-8");
      let existingHooks = {};

      if (existingContent.trim()) {
        try {
          existingHooks = JSON.parse(existingContent);
        } catch {
          await fs.writeFile(hooksPath, JSON.stringify(this.getJumboHooks(), null, 2) + "\n", "utf-8");
          return;
        }
      }

      const normalizedExistingHooks = this.removeStaleJumboHooks(existingHooks);
      const mergedHooks = this.mergeHooks(normalizedExistingHooks, this.getJumboHooks());
      await fs.writeFile(hooksPath, JSON.stringify(mergedHooks, null, 2) + "\n", "utf-8");
    } catch (error) {
      console.warn(
        `Warning: Failed to configure Codex hooks: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private getJumboHooks(): any {
    return AgentFileAssetContent.readJson("codex-hooks.fragment.json");
  }

  private mergeHooks(existing: any, jumbo: any): any {
    const result = { ...existing };
    result.hooks = result.hooks ?? {};

    for (const [eventName, matcherGroups] of Object.entries(jumbo.hooks ?? {})) {
      const existingGroups = Array.isArray(result.hooks[eventName]) ? result.hooks[eventName] : [];
      result.hooks[eventName] = this.mergeMatcherGroups(existingGroups, matcherGroups as any[]);
    }

    return result;
  }

  private mergeMatcherGroups(existing: any[], additions: any[]): any[] {
    const merged = [...existing];

    for (const addition of additions) {
      const existingIndex = merged.findIndex((entry) => entry?.matcher === addition.matcher);

      if (existingIndex >= 0) {
        merged[existingIndex] = {
          ...merged[existingIndex],
          hooks: this.mergeHookArray(
            Array.isArray(merged[existingIndex].hooks) ? merged[existingIndex].hooks : [],
            addition.hooks
          ),
        };
      } else {
        merged.push(addition);
      }
    }

    return merged;
  }

  private mergeHookArray(existing: any[], additions: any[]): any[] {
    const merged = [...existing];
    const existingKeys = new Set(existing.map((hook) => JSON.stringify(hook)));

    for (const addition of additions) {
      const additionKey = JSON.stringify(addition);
      if (!existingKeys.has(additionKey)) {
        merged.push(addition);
        existingKeys.add(additionKey);
      }
    }

    return merged;
  }

  private removeStaleJumboHooks(existing: any): any {
    if (!existing || typeof existing !== "object") {
      return {};
    }

    const result = { ...existing };
    const rawHooks = existing.hooks;
    if (!rawHooks || typeof rawHooks !== "object") {
      return result;
    }

    const normalizedHooks: Record<string, unknown[]> = {};
    for (const [eventName, matcherGroups] of Object.entries(rawHooks)) {
      if (!Array.isArray(matcherGroups)) {
        continue;
      }

      const normalizedGroups = matcherGroups
        .map((matcherGroup) => this.removeStaleJumboHooksFromMatcher(matcherGroup))
        .filter((matcherGroup): matcherGroup is Record<string, unknown> => matcherGroup !== null);

      if (normalizedGroups.length > 0) {
        normalizedHooks[eventName] = normalizedGroups;
      }
    }

    result.hooks = normalizedHooks;
    return result;
  }

  private removeStaleJumboHooksFromMatcher(matcherGroup: unknown): Record<string, unknown> | null {
    if (!matcherGroup || typeof matcherGroup !== "object") {
      return null;
    }

    const candidate = matcherGroup as Record<string, unknown>;
    const hooks = Array.isArray(candidate.hooks) ? candidate.hooks : [];
    const nonJumboHooks = hooks.filter((hook) => !this.isJumboLifecycleHook(hook));

    if (nonJumboHooks.length === 0) {
      return null;
    }

    return {
      ...candidate,
      hooks: nonJumboHooks,
    };
  }

  private isJumboLifecycleHook(hook: unknown): boolean {
    if (!hook || typeof hook !== "object") {
      return false;
    }

    const command = (hook as Record<string, unknown>).command;
    return (
      command === "jumbo session start" ||
      command === "jumbo session start --format text" ||
      command === "jumbo work resume" ||
      command === "jumbo work resume --format text" ||
      command === "jumbo work pause" ||
      command === "jumbo work pause --format text"
    );
  }

  /**
   * Return what changes this configurer will make without executing.
   */
  async getPlannedFileChanges(projectRoot: string): Promise<PlannedFileChange[]> {
    const hooksPath = path.join(projectRoot, ".codex", "hooks.json");

    return [
      {
        path: ".codex/hooks.json",
        action: (await fs.pathExists(hooksPath)) ? "modify" : "create",
        description: "Add Codex lifecycle hooks using text-mode Jumbo output",
      },
    ];
  }
}
