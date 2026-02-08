import * as fs from "fs-extra";
import * as path from "path";

/**
 * Gemini CLI settings structure
 * Based on Gemini CLI hooks configuration
 */
export interface GeminiCommandHook {
  type: "command";
  command: string;
}

export interface GeminiPromptHook {
  type: "prompt";
  prompt: string;
}

export type GeminiHook = GeminiCommandHook | GeminiPromptHook;

export interface GeminiHookMatcher {
  matcher: string;
  hooks: GeminiHook[];
}

export interface GeminiSettings {
  hooks?: {
    SessionStart?: GeminiHookMatcher[];
    PreCompress?: GeminiHookMatcher[];
    SessionEnd?: GeminiHookMatcher[];
    [key: string]: GeminiHookMatcher[] | undefined;
  };
  tools?: {
    allowed?: string[];
  };
}

/**
 * Safe merger for Gemini CLI settings.json files
 *
 * Strategy:
 * - Creates backup before modification
 * - Deep merges objects, deduplicates arrays
 * - Lenient with existing user config (may have extensions or typos)
 * - Rolls back on error
 * - Idempotent (safe to run multiple times)
 *
 * @example
 * await SafeGeminiSettingsMerger.mergeSettings(projectRoot, {
 *   hooks: {
 *     SessionStart: [{
 *       matcher: "startup",
 *       hooks: [{ type: "command", command: "jumbo session start" }]
 *     }]
 *   }
 * });
 */
export class SafeGeminiSettingsMerger {
  /**
   * Merges new settings into existing .gemini/settings.json
   *
   * @param projectRoot - Root directory of the project
   * @param newSettings - Settings to merge in
   * @throws Error if JSON is malformed
   */
  static async mergeSettings(
    projectRoot: string,
    newSettings: GeminiSettings
  ): Promise<void> {
    const settingsPath = path.join(projectRoot, ".gemini", "settings.json");
    const backupPath = `${settingsPath}.backup.${Date.now()}`;

    // Ensure .gemini directory exists
    await fs.ensureDir(path.join(projectRoot, ".gemini"));

    // STEP 1: Create backup if file exists
    if (await fs.pathExists(settingsPath)) {
      await fs.copy(settingsPath, backupPath);
    }

    try {
      // STEP 2: Read existing or use empty object
      // Be lenient with existing user content - only parse JSON, don't validate structure
      // User's config may have extensions or typos we shouldn't reject
      let existing: GeminiSettings = {};
      if (await fs.pathExists(settingsPath)) {
        const content = await fs.readFile(settingsPath, "utf-8");
        // Handle empty file case - treat as empty config
        if (content.trim()) {
          existing = JSON.parse(content);
        }
      }

      // STEP 3: Merge safely
      const merged = this.deepMerge(existing, newSettings);

      // STEP 4: Write back with formatting
      // Skip validation - user's config may have extensions or typos we should preserve
      await fs.writeFile(
        settingsPath,
        JSON.stringify(merged, null, 2) + "\n",
        "utf-8"
      );

      // STEP 5: Cleanup backup on success (optional - keep for audit trail)
      // await fs.remove(backupPath);
    } catch (error) {
      // STEP 6: Rollback on error
      if (await fs.pathExists(backupPath)) {
        await fs.copy(backupPath, settingsPath, { overwrite: true });
      }
      throw error;
    }
  }

  /**
   * Deep merges two settings objects
   * - Objects are merged recursively
   * - Arrays are deduplicated based on content
   * - Existing user settings are preserved
   */
  private static deepMerge(
    existing: GeminiSettings,
    newSettings: GeminiSettings
  ): GeminiSettings {
    const result: GeminiSettings = { ...existing };

    // Merge hooks - handle all event types generically
    if (newSettings.hooks) {
      result.hooks = result.hooks ?? {};

      for (const eventType of Object.keys(newSettings.hooks)) {
        const newHooks = newSettings.hooks[eventType];
        if (newHooks) {
          const existingHooks = existing.hooks?.[eventType] ?? [];
          result.hooks[eventType] = this.mergeHookMatchers(
            existingHooks,
            newHooks
          );
        }
      }
    }

    // Merge tools
    if (newSettings.tools) {
      result.tools = result.tools ?? {};

      // Merge allowed array (unique values)
      if (newSettings.tools.allowed) {
        const existingAllowed = existing.tools?.allowed ?? [];
        const newAllowed = newSettings.tools.allowed;
        result.tools.allowed = Array.from(new Set([...existingAllowed, ...newAllowed]));
      }
    }

    return result;
  }

  /**
   * Merges hook matcher arrays, deduplicating by hook content
   */
  private static mergeHookMatchers(
    existing: GeminiHookMatcher[],
    additions: GeminiHookMatcher[]
  ): GeminiHookMatcher[] {
    const merged = [...existing];

    for (const newMatcher of additions) {
      // Find existing matcher with same matcher type
      const existingIndex = merged.findIndex(
        (m) => m.matcher === newMatcher.matcher
      );

      if (existingIndex >= 0) {
        // Merge hooks within the same matcher, deduplicating by content
        const existingMatcher = merged[existingIndex];
        const hookMap = new Map<string, GeminiHook>();

        // Add existing hooks - key by unique content
        for (const hook of existingMatcher.hooks) {
          hookMap.set(this.getHookKey(hook), hook);
        }

        // Add new hooks (overwrites if same key)
        for (const hook of newMatcher.hooks) {
          hookMap.set(this.getHookKey(hook), hook);
        }

        merged[existingIndex] = {
          ...existingMatcher,
          hooks: Array.from(hookMap.values()),
        };
      } else {
        // No existing matcher with this type, add it
        merged.push(newMatcher);
      }
    }

    return merged;
  }

  /**
   * Generate a unique key for a hook based on its type and content
   * Handles malformed hooks gracefully by including all available properties
   */
  private static getHookKey(hook: GeminiHook): string {
    // Handle malformed hooks that might have mismatched type/content
    const anyHook = hook as unknown as Record<string, unknown>;
    if (hook.type === "command" && typeof anyHook.command === "string") {
      return `command:${anyHook.command}`;
    } else if (hook.type === "prompt" && typeof anyHook.prompt === "string") {
      return `prompt:${anyHook.prompt}`;
    } else {
      // Fallback for malformed hooks - use JSON serialization for uniqueness
      return `unknown:${JSON.stringify(hook)}`;
    }
  }
}
