/**
 * InitializeProjectCommandHandler - Command handler for project initialization.
 *
 * This handler:
 * 1. Validates preconditions (not already initialized)
 * 2. Creates the Project aggregate
 * 3. Executes domain logic (initialize)
 * 4. Persists event to event store
 * 5. Publishes event to event bus for projection updates
 * 6. Creates/updates AGENTS.md with Jumbo instructions
 * 7. Configures all supported agents (markdown files, settings, hooks)
 * 8. Ensures .gitignore excludes Jumbo internal state
 */

import { InitializeProjectCommand } from "./InitializeProjectCommand.js";
import { IProjectInitializedEventWriter } from "./IProjectInitializedEventWriter.js";
import { IEventBus } from "../../../messaging/IEventBus.js";
import { IProjectInitReader } from "./IProjectInitReader.js";
import { IAgentFileProtocol } from "./IAgentFileProtocol.js";
import { IGitignoreProtocol } from "./IGitignoreProtocol.js";
import { ISettingsInitializer } from "../../../settings/ISettingsInitializer.js";
import { Project } from "../../../../domain/project/Project.js";
import { ProjectErrorMessages } from "../../../../domain/project/Constants.js";

export class InitializeProjectCommandHandler {
  constructor(
    private readonly eventWriter: IProjectInitializedEventWriter,
    private readonly eventBus: IEventBus,
    private readonly reader: IProjectInitReader,
    private readonly agentFileProtocol: IAgentFileProtocol,
    private readonly settingsInitializer: ISettingsInitializer,
    private readonly gitignoreProtocol: IGitignoreProtocol
  ) {}

  async execute(
    command: InitializeProjectCommand,
    projectRoot: string
  ): Promise<{ projectId: string }> {
    // Check if project already exists (precondition)
    const existingProject = await this.reader.getProject();
    if (existingProject) {
      throw new Error(ProjectErrorMessages.ALREADY_INITIALIZED);
    }

    // 1. Create new aggregate
    const projectId = "project"; // Single project per codebase
    const project = Project.create(projectId);

    // 2. Domain logic produces event
    const event = project.initialize(
      command.name,
      command.purpose,
    );

    // 3. Persist event to file store
    await this.eventWriter.append(event);

    // 4. Publish event to bus (projections will update via subscriptions)
    await this.eventBus.publish(event);

    // 5. Create/update AGENTS.md (side effect)
    await this.agentFileProtocol.ensureAgentsMd(projectRoot);

    // 6. Configure all supported agents (side effect)
    await this.agentFileProtocol.ensureAgentConfigurations(projectRoot);

    // 7. Ensure default settings file exists (side effect)
    await this.settingsInitializer.ensureSettingsFileExists();

    // 8. Ensure .gitignore excludes Jumbo internal state (side effect)
    await this.gitignoreProtocol.ensureExclusions(projectRoot);

    return { projectId };
  }
}
