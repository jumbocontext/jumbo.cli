/**
 * Port: Gitignore Protocol
 *
 * Defines interface for ensuring .gitignore excludes Jumbo's internal
 * state files (.jumbo/ directory and database) during project initialization.
 *
 * Responsibilities:
 * - Ensure .gitignore contains exclusion patterns for .jumbo/ and .jumbo/jumbo.db
 * - Respect existing user customizations (never overwrite existing patterns)
 * - Report planned file changes for preview before execution
 *
 * Design Notes:
 * - Operations are idempotent (safe to run multiple times)
 * - Side effects only (no domain events emitted)
 */

import { PlannedFileChange } from "./PlannedFileChange.js";

export interface IGitignoreProtocol {
  /**
   * Ensure .gitignore contains exclusion patterns for Jumbo's internal files.
   *
   * Behavior:
   * - If .gitignore doesn't exist: Create it with both exclusion patterns
   * - If .gitignore exists but lacks patterns: Append missing patterns
   * - If patterns already exist (active, negated, or commented): Leave unchanged
   * - Partial presence: Append only missing patterns
   *
   * @param projectRoot Absolute path to project root directory
   */
  ensureExclusions(projectRoot: string): Promise<void>;

  /**
   * Get planned file changes without executing.
   * Use this for preview before user confirmation.
   *
   * @param projectRoot Absolute path to project root directory
   * @returns List of planned file changes
   */
  getPlannedFileChanges(projectRoot: string): Promise<PlannedFileChange[]>;
}
