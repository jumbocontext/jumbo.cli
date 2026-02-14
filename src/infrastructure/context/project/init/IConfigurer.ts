/**
 * Infrastructure: Configurer Interface
 *
 * Defines the contract for agent configurers. Each configurer encapsulates
 * all knowledge about a specific AI agent's configuration requirements.
 *
 * This interface enables:
 * - Polymorphic iteration over configurers in AgentFileProtocol
 * - Planned changes collection for preview before execution
 * - Easy extension: add new agent by creating a new Configurer class
 */

import { PlannedFileChange } from "../../../../application/context/project/init/PlannedFileChange.js";

export interface IConfigurer {
  /**
   * Execute the configuration for this agent.
   *
   * @param projectRoot Absolute path to project root directory
   */
  configure(projectRoot: string): Promise<void>;

  /**
   * Repair this agent's configuration by replacing stale content
   * with the current version. Optional — if not implemented,
   * AgentFileProtocol falls back to configure().
   *
   * @param projectRoot Absolute path to project root directory
   */
  repair?(projectRoot: string): Promise<void>;

  /**
   * Return what changes this configurer will make without executing.
   * Used for preview before user confirmation.
   *
   * @param projectRoot Absolute path to project root directory
   * @returns List of planned file changes
   */
  getPlannedFileChanges(projectRoot: string): Promise<PlannedFileChange[]>;
}
