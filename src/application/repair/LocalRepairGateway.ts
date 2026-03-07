import { IRepairGateway } from "./IRepairGateway.js";
import { RepairRequest } from "./RepairRequest.js";
import { RepairResponse, RepairStepResult } from "./RepairResponse.js";
import { IAgentFileProtocol } from "../context/project/init/IAgentFileProtocol.js";
import { ISettingsInitializer } from "../settings/ISettingsInitializer.js";
import { IDatabaseRebuildService } from "../maintenance/db/rebuild/IDatabaseRebuildService.js";
import { IProjectRootResolver } from "../context/project/IProjectRootResolver.js";

export class LocalRepairGateway implements IRepairGateway {
  constructor(
    private readonly projectRootResolver: IProjectRootResolver,
    private readonly agentFileProtocol: IAgentFileProtocol,
    private readonly settingsInitializer: ISettingsInitializer,
    private readonly databaseRebuildService: IDatabaseRebuildService
  ) {}

  async repair(request: RepairRequest): Promise<RepairResponse> {
    const projectRoot = this.projectRootResolver.resolve();
    const steps: RepairStepResult[] = [];

    // Step 1: Repair AGENTS.md
    if (request.doAgents) {
      try {
        await this.agentFileProtocol.repairAgentsMd(projectRoot);
        steps.push({ name: "AGENTS.md", status: "repaired" });
      } catch (error) {
        steps.push({
          name: "AGENTS.md",
          status: "failed",
          detail: error instanceof Error ? error.message : String(error),
        });
      }
    } else {
      steps.push({ name: "AGENTS.md", status: "skipped" });
    }

    // Step 2: Repair agent configurations (CLAUDE.md, GEMINI.md, copilot, hooks, managed skills, settings)
    if (request.doAgents) {
      try {
        await this.agentFileProtocol.repairAgentConfigurations(projectRoot);
        steps.push({ name: "Agent configurations", status: "repaired" });
      } catch (error) {
        steps.push({
          name: "Agent configurations",
          status: "failed",
          detail: error instanceof Error ? error.message : String(error),
        });
      }
    } else {
      steps.push({ name: "Agent configurations", status: "skipped" });
    }

    // Step 3: Ensure settings.jsonc
    if (request.doSettings) {
      try {
        await this.settingsInitializer.ensureSettingsFileExists();
        steps.push({ name: "Settings", status: "repaired" });
      } catch (error) {
        steps.push({
          name: "Settings",
          status: "failed",
          detail: error instanceof Error ? error.message : String(error),
        });
      }
    } else {
      steps.push({ name: "Settings", status: "skipped" });
    }

    // Step 4: Rebuild database
    if (request.doDb) {
      try {
        const result = await this.databaseRebuildService.rebuild();
        steps.push({
          name: "Database",
          status: "repaired",
          detail: `${result.eventsReplayed} events replayed`,
        });
      } catch (error) {
        steps.push({
          name: "Database",
          status: "failed",
          detail: error instanceof Error ? error.message : String(error),
        });
      }
    } else {
      steps.push({ name: "Database", status: "skipped" });
    }

    return { steps };
  }
}
