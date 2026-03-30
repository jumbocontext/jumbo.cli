/**
 * Infrastructure: OpenAI Codex Configurer
 *
 * Encapsulates all knowledge about OpenAI Codex configuration:
 * - Skills distributed to .codex/skills
 *
 * Codex reads AGENTS.md natively, so no instruction file is needed.
 * Codex does not support lifecycle hooks, so configuration is
 * limited to skill distribution.
 *
 * Operations are idempotent and gracefully handle errors.
 */

import { IConfigurer } from "./IConfigurer.js";
import { PlannedFileChange } from "../../../../application/context/project/init/PlannedFileChange.js";

export class CodexConfigurer implements IConfigurer {
  readonly agent = {
    id: "codex",
    name: "Codex",
  } as const;

  readonly skillPlatforms = [".codex/skills"] as const;

  /**
   * Configure all OpenAI Codex requirements for Jumbo.
   * Codex reads AGENTS.md natively and has no hook system,
   * so no additional configuration files are needed.
   *
   * @param projectRoot Absolute path to project root directory
   */
  async configure(_projectRoot: string): Promise<void> {
    // Codex reads AGENTS.md natively - no additional files needed.
    // Skills are installed by AgentFileProtocol via skillPlatforms.
  }

  /**
   * Return what changes this configurer will make without executing.
   */
  async getPlannedFileChanges(_projectRoot: string): Promise<PlannedFileChange[]> {
    return [];
  }
}
