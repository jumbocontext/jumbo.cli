/**
 * Port: Agent File Protocol
 *
 * Defines interface for managing AI agent instruction files and configuration
 * during project initialization.
 *
 * Responsibilities:
 * - Ensure AGENTS.md exists with Jumbo instructions
 * - Ensure all supported agents are configured
 * - Report planned file changes for preview before execution
 *
 * Design Notes:
 * - Operations are idempotent (safe to run multiple times)
 * - Side effects only (no domain events emitted)
 * - Errors logged but don't fail initialization (graceful degradation)
 * - Agent-specific knowledge is encapsulated in individual Configurer classes
 */

import { PlannedFileChange } from "./PlannedFileChange.js";

export interface IAgentFileProtocol {
  /**
   * Ensure AGENTS.md exists with Jumbo instructions.
   *
   * Behavior:
   * - If AGENTS.md doesn't exist: Create it with full content
   * - If AGENTS.md exists without Jumbo Instructions: Append Jumbo Instructions section
   * - If AGENTS.md exists with Jumbo Instructions section: Replace with current version
   *
   * @param projectRoot Absolute path to project root directory
   */
  ensureAgentsMd(projectRoot: string): Promise<void>;

  /**
   * Ensure all supported agents are configured for Jumbo.
   *
   * Orchestrates configuration for all supported agents by delegating
   * to each agent's dedicated Configurer class and by distributing
   * all template-managed skills from templates/skills/ into each
   * configured platform skill directory.
   *
   * Behavior:
   * - Delegates to each agent's Configurer
   * - Installs template-managed skills additively for each platform
   * - Each Configurer handles its own error recovery
   * - Failures in one agent don't affect others
   *
   * @param projectRoot Absolute path to project root directory
   */
  ensureAgentConfigurations(projectRoot: string): Promise<void>;

  /**
   * Repair AGENTS.md by replacing the Jumbo section with the current version.
   *
   * Behavior:
   * - If AGENTS.md doesn't exist: Create it with full content
   * - If AGENTS.md exists with Jumbo section: Replace section with current version
   * - If AGENTS.md exists without Jumbo section: Append current Jumbo section
   *
   * @param projectRoot Absolute path to project root directory
   */
  repairAgentsMd(projectRoot: string): Promise<void>;

  /**
   * Repair all supported agent configurations.
   *
   * Orchestrates repair for all supported agents by delegating to each
   * agent's dedicated Configurer class, then overwrites all
   * template-managed skills from templates/skills/ for each configured
   * platform directory. Uses repair() if available, otherwise falls
   * back to configure().
   *
   * @param projectRoot Absolute path to project root directory
   */
  repairAgentConfigurations(projectRoot: string): Promise<void>;

  /**
   * Get all planned file changes without executing.
   * Use this for preview before user confirmation.
   *
   * Includes:
   * - AGENTS.md (create or modify)
   * - All agent-specific files from configurers
   *
   * @param projectRoot Absolute path to project root directory
   * @returns List of planned file changes
   */
  getPlannedFileChanges(projectRoot: string): Promise<PlannedFileChange[]>;
}
