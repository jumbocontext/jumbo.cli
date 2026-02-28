/**
 * Tests for InitializeProjectCommandHandler
 */

import { InitializeProjectCommandHandler } from "../../../../../src/application/context/project/init/InitializeProjectCommandHandler.js";
import { InitializeProjectCommand } from "../../../../../src/application/context/project/init/InitializeProjectCommand.js";
import { IProjectInitializedEventWriter } from "../../../../../src/application/context/project/init/IProjectInitializedEventWriter.js";
import { IProjectInitReader } from "../../../../../src/application/context/project/init/IProjectInitReader.js";
import { IAgentFileProtocol } from "../../../../../src/application/context/project/init/IAgentFileProtocol.js";
import { IGitignoreProtocol } from "../../../../../src/application/context/project/init/IGitignoreProtocol.js";
import { ISettingsInitializer } from "../../../../../src/application/settings/ISettingsInitializer.js";
import { IEventBus } from "../../../../../src/application/messaging/IEventBus.js";
import { ProjectErrorMessages, ProjectEventType } from "../../../../../src/domain/project/Constants.js";
import { ProjectInitializedEvent } from "../../../../../src/domain/project/init/ProjectInitializedEvent.js";
import { ProjectView } from "../../../../../src/application/context/project/ProjectView.js";
import { AppendResult } from "../../../../../src/application/persistence/IEventStore.js";

describe("InitializeProjectCommandHandler", () => {
  let handler: InitializeProjectCommandHandler;
  let eventWriter: jest.Mocked<IProjectInitializedEventWriter>;
  let eventBus: jest.Mocked<IEventBus>;
  let reader: jest.Mocked<IProjectInitReader>;
  let agentFileProtocol: jest.Mocked<IAgentFileProtocol>;
  let settingsInitializer: jest.Mocked<ISettingsInitializer>;
  let gitignoreProtocol: jest.Mocked<IGitignoreProtocol>;

  beforeEach(() => {
    eventWriter = {
      append: jest.fn().mockResolvedValue({ nextSeq: 1 } as AppendResult),
      readStream: jest.fn(),
    };

    eventBus = {
      publish: jest.fn(),
      subscribe: jest.fn(),
    };

    reader = {
      getProject: jest.fn(),
    };

    agentFileProtocol = {
      ensureAgentsMd: jest.fn().mockResolvedValue(undefined),
      ensureAgentConfigurations: jest.fn().mockResolvedValue(undefined),
      repairAgentsMd: jest.fn().mockResolvedValue(undefined),
      repairAgentConfigurations: jest.fn().mockResolvedValue(undefined),
      getPlannedFileChanges: jest.fn().mockResolvedValue([]),
    };

    settingsInitializer = {
      ensureSettingsFileExists: jest.fn().mockResolvedValue(undefined),
      getPlannedFileChange: jest.fn().mockResolvedValue(null),
    };

    gitignoreProtocol = {
      ensureExclusions: jest.fn().mockResolvedValue(undefined),
      getPlannedFileChanges: jest.fn().mockResolvedValue([]),
    };

    handler = new InitializeProjectCommandHandler(
      eventWriter,
      eventBus,
      reader,
      agentFileProtocol,
      settingsInitializer,
      gitignoreProtocol
    );
  });

  describe("execute()", () => {
    it("should throw error if project is already initialized", async () => {
      const existingView: ProjectView = {
        projectId: "project",
        name: "Existing Project",
        purpose: "Already set",
        version: 1,
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-01T00:00:00.000Z",
      };

      reader.getProject.mockResolvedValue(existingView);

      const command: InitializeProjectCommand = {
        name: "New Project",
        purpose: "New purpose",
      };

      await expect(handler.execute(command, "/repo")).rejects.toThrow(
        ProjectErrorMessages.ALREADY_INITIALIZED
      );
      expect(eventWriter.append).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
      expect(agentFileProtocol.ensureAgentsMd).not.toHaveBeenCalled();
      expect(agentFileProtocol.ensureAgentConfigurations).not.toHaveBeenCalled();
      expect(settingsInitializer.ensureSettingsFileExists).not.toHaveBeenCalled();
      expect(gitignoreProtocol.ensureExclusions).not.toHaveBeenCalled();
    });

    it("should initialize project and ensure all side effects execute", async () => {
      reader.getProject.mockResolvedValue(null);

      const command: InitializeProjectCommand = {
        name: "Jumbo",
        purpose: "LLM context management",
      };

      const result = await handler.execute(command, "/repo");

      expect(result.projectId).toBe("project");
      expect(eventWriter.append).toHaveBeenCalledTimes(1);

      const appendedEvent = eventWriter.append.mock.calls[0][0] as ProjectInitializedEvent;
      expect(appendedEvent.type).toBe(ProjectEventType.INITIALIZED);
      expect(appendedEvent.aggregateId).toBe("project");
      expect(appendedEvent.version).toBe(1);
      expect(appendedEvent.payload.name).toBe(command.name);
      expect(appendedEvent.payload.purpose).toBe(command.purpose);

      expect(eventBus.publish).toHaveBeenCalledWith(appendedEvent);
      expect(agentFileProtocol.ensureAgentsMd).toHaveBeenCalledWith("/repo");
      expect(agentFileProtocol.ensureAgentConfigurations).toHaveBeenCalledWith("/repo");
      expect(settingsInitializer.ensureSettingsFileExists).toHaveBeenCalledTimes(1);
      expect(gitignoreProtocol.ensureExclusions).toHaveBeenCalledWith("/repo");
    });
  });
});
