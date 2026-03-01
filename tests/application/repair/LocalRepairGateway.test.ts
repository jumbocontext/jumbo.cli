import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalRepairGateway } from "../../../src/application/repair/LocalRepairGateway.js";
import { IProjectRootResolver } from "../../../src/application/context/project/IProjectRootResolver.js";
import { IAgentFileProtocol } from "../../../src/application/context/project/init/IAgentFileProtocol.js";
import { ISettingsInitializer } from "../../../src/application/settings/ISettingsInitializer.js";
import { IDatabaseRebuildService } from "../../../src/application/maintenance/db/rebuild/IDatabaseRebuildService.js";

describe("LocalRepairGateway", () => {
  let gateway: LocalRepairGateway;
  let mockProjectRootResolver: jest.Mocked<IProjectRootResolver>;
  let mockAgentFileProtocol: jest.Mocked<IAgentFileProtocol>;
  let mockSettingsInitializer: jest.Mocked<ISettingsInitializer>;
  let mockDatabaseRebuildService: jest.Mocked<IDatabaseRebuildService>;

  const projectRoot = "/test/project";

  beforeEach(() => {
    mockProjectRootResolver = {
      resolve: jest.fn().mockReturnValue(projectRoot),
    } as jest.Mocked<IProjectRootResolver>;

    mockAgentFileProtocol = {
      ensureAgentsMd: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      ensureAgentConfigurations: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      repairAgentsMd: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      repairAgentConfigurations: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      getPlannedFileChanges: jest.fn().mockResolvedValue([]),
    } as jest.Mocked<IAgentFileProtocol>;

    mockSettingsInitializer = {
      ensureSettingsFileExists: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      getPlannedFileChange: jest.fn().mockResolvedValue(null),
    } as jest.Mocked<ISettingsInitializer>;

    mockDatabaseRebuildService = {
      rebuild: jest.fn().mockResolvedValue({ eventsReplayed: 10, success: true }),
    } as jest.Mocked<IDatabaseRebuildService>;

    gateway = new LocalRepairGateway(
      mockProjectRootResolver,
      mockAgentFileProtocol,
      mockSettingsInitializer,
      mockDatabaseRebuildService
    );
  });

  describe("all steps enabled", () => {
    it("should execute all repair steps and return results", async () => {
      const response = await gateway.repair({
        doAgents: true,
        doSettings: true,
        doDb: true,
      });

      expect(response.steps).toHaveLength(4);
      expect(response.steps[0]).toEqual({ name: "AGENTS.md", status: "repaired" });
      expect(response.steps[1]).toEqual({ name: "Agent configurations", status: "repaired" });
      expect(response.steps[2]).toEqual({ name: "Settings", status: "repaired" });
      expect(response.steps[3]).toEqual({ name: "Database", status: "repaired", detail: "10 events replayed" });
    });

    it("should call services with correct arguments", async () => {
      await gateway.repair({ doAgents: true, doSettings: true, doDb: true });

      expect(mockProjectRootResolver.resolve).toHaveBeenCalled();
      expect(mockAgentFileProtocol.repairAgentsMd).toHaveBeenCalledWith(projectRoot);
      expect(mockAgentFileProtocol.repairAgentConfigurations).toHaveBeenCalledWith(projectRoot);
      expect(mockSettingsInitializer.ensureSettingsFileExists).toHaveBeenCalled();
      expect(mockDatabaseRebuildService.rebuild).toHaveBeenCalled();
    });
  });

  describe("all steps skipped", () => {
    it("should return skipped status for all steps", async () => {
      const response = await gateway.repair({
        doAgents: false,
        doSettings: false,
        doDb: false,
      });

      expect(response.steps).toHaveLength(4);
      expect(response.steps.every(s => s.status === "skipped")).toBe(true);
    });

    it("should not call any services", async () => {
      await gateway.repair({ doAgents: false, doSettings: false, doDb: false });

      expect(mockAgentFileProtocol.repairAgentsMd).not.toHaveBeenCalled();
      expect(mockAgentFileProtocol.repairAgentConfigurations).not.toHaveBeenCalled();
      expect(mockSettingsInitializer.ensureSettingsFileExists).not.toHaveBeenCalled();
      expect(mockDatabaseRebuildService.rebuild).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should capture agent repair failure and continue", async () => {
      mockAgentFileProtocol.repairAgentsMd.mockRejectedValue(new Error("Permission denied"));

      const response = await gateway.repair({
        doAgents: true,
        doSettings: true,
        doDb: true,
      });

      expect(response.steps[0]).toEqual({
        name: "AGENTS.md",
        status: "failed",
        detail: "Permission denied",
      });
      // Subsequent steps should still execute
      expect(response.steps[1]).toEqual({ name: "Agent configurations", status: "repaired" });
      expect(response.steps[2]).toEqual({ name: "Settings", status: "repaired" });
      expect(response.steps[3]).toEqual({ name: "Database", status: "repaired", detail: "10 events replayed" });
    });

    it("should capture database rebuild failure", async () => {
      mockDatabaseRebuildService.rebuild.mockRejectedValue(new Error("DB locked"));

      const response = await gateway.repair({
        doAgents: false,
        doSettings: false,
        doDb: true,
      });

      const dbStep = response.steps.find(s => s.name === "Database");
      expect(dbStep).toEqual({
        name: "Database",
        status: "failed",
        detail: "DB locked",
      });
    });

    it("should capture settings failure", async () => {
      mockSettingsInitializer.ensureSettingsFileExists.mockRejectedValue(new Error("Disk full"));

      const response = await gateway.repair({
        doAgents: false,
        doSettings: true,
        doDb: false,
      });

      const settingsStep = response.steps.find(s => s.name === "Settings");
      expect(settingsStep).toEqual({
        name: "Settings",
        status: "failed",
        detail: "Disk full",
      });
    });

    it("should handle non-Error thrown values", async () => {
      mockAgentFileProtocol.repairAgentsMd.mockRejectedValue("string error");

      const response = await gateway.repair({
        doAgents: true,
        doSettings: false,
        doDb: false,
      });

      expect(response.steps[0]).toEqual({
        name: "AGENTS.md",
        status: "failed",
        detail: "string error",
      });
    });
  });

  describe("partial execution", () => {
    it("should only run agents when others are skipped", async () => {
      const response = await gateway.repair({
        doAgents: true,
        doSettings: false,
        doDb: false,
      });

      expect(mockAgentFileProtocol.repairAgentsMd).toHaveBeenCalled();
      expect(mockAgentFileProtocol.repairAgentConfigurations).toHaveBeenCalled();
      expect(mockSettingsInitializer.ensureSettingsFileExists).not.toHaveBeenCalled();
      expect(mockDatabaseRebuildService.rebuild).not.toHaveBeenCalled();

      expect(response.steps[0].status).toBe("repaired");
      expect(response.steps[1].status).toBe("repaired");
      expect(response.steps[2].status).toBe("skipped");
      expect(response.steps[3].status).toBe("skipped");
    });

    it("should only run db when others are skipped", async () => {
      const response = await gateway.repair({
        doAgents: false,
        doSettings: false,
        doDb: true,
      });

      expect(mockAgentFileProtocol.repairAgentsMd).not.toHaveBeenCalled();
      expect(mockDatabaseRebuildService.rebuild).toHaveBeenCalled();

      expect(response.steps[0].status).toBe("skipped");
      expect(response.steps[1].status).toBe("skipped");
      expect(response.steps[2].status).toBe("skipped");
      expect(response.steps[3].status).toBe("repaired");
    });
  });
});
