/**
 * Application: Initialization Protocol Implementation
 *
 * Orchestrates project initialization operations. Composes the command handler
 * with planned changes functionality to provide a unified API.
 *
 * This service:
 * - Provides preview of all planned file changes
 * - Executes initialization via the command handler
 * - Returns actual changes made during execution
 */

import { IInitializationProtocol, InitializationResult } from "./IInitializationProtocol.js";
import { PlannedFileChange } from "./PlannedFileChange.js";
import { InitializeProjectCommand } from "./InitializeProjectCommand.js";
import { InitializeProjectCommandHandler } from "./InitializeProjectCommandHandler.js";
import { IAgentFileProtocol } from "./IAgentFileProtocol.js";
import { ISettingsInitializer } from "../../../settings/ISettingsInitializer.js";

export class InitializationProtocol implements IInitializationProtocol {
  constructor(
    private readonly commandHandler: InitializeProjectCommandHandler,
    private readonly agentFileProtocol: IAgentFileProtocol,
    private readonly settingsInitializer: ISettingsInitializer
  ) {}

  /**
   * Get all planned changes for initialization without executing.
   */
  async getPlannedFileChanges(projectRoot: string): Promise<PlannedFileChange[]> {
    const changes: PlannedFileChange[] = [];

    // Get agent file changes (AGENTS.md and all agent configurers)
    const agentChanges = await this.agentFileProtocol.getPlannedFileChanges(projectRoot);
    changes.push(...agentChanges);

    // Get settings file change (if needed)
    const settingsChange = await this.settingsInitializer.getPlannedFileChange();
    if (settingsChange) {
      changes.push(settingsChange);
    }

    return changes;
  }

  /**
   * Execute initialization and return what was done.
   */
  async execute(
    command: InitializeProjectCommand,
    projectRoot: string
  ): Promise<InitializationResult> {
    // Get planned changes before execution (for accurate result)
    const changes = await this.getPlannedFileChanges(projectRoot);

    // Execute the command (persists event, creates files)
    const result = await this.commandHandler.execute(command, projectRoot);

    return {
      projectId: result.projectId,
      changes,
    };
  }
}
