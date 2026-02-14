/**
 * Port: Initialization Protocol
 *
 * High-level interface for project initialization operations.
 * Provides both preview (what will change) and execution capabilities.
 *
 * This abstraction enables:
 * - Preview before execution (user confirmation)
 * - Single source of truth for file changes
 * - Decoupling presentation from application logic
 */

import { PlannedFileChange } from "./PlannedFileChange.js";
import { InitializeProjectCommand } from "./InitializeProjectCommand.js";

/**
 * Result of project initialization
 */
export interface InitializationResult {
  /** The unique project identifier */
  projectId: string;
  /** The actual changes made during initialization */
  changes: PlannedFileChange[];
}

/**
 * Protocol for project initialization operations
 */
export interface IInitializationProtocol {
  /**
   * Get all planned changes for initialization without executing.
   * Use this for preview before user confirmation.
   *
   * @param projectRoot Absolute path to project root directory
   * @returns List of planned file changes
   */
  getPlannedFileChanges(projectRoot: string): Promise<PlannedFileChange[]>;

  /**
   * Execute initialization and return what was done.
   *
   * @param command The initialization command with project details
   * @param projectRoot Absolute path to project root directory
   * @returns Initialization result with project ID and actual changes
   */
  execute(
    command: InitializeProjectCommand,
    projectRoot: string
  ): Promise<InitializationResult>;
}
