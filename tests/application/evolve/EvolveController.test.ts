import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { IProjectRootResolver } from "../../../src/application/context/project/IProjectRootResolver.js";
import { IAgentFileProtocol } from "../../../src/application/context/project/init/IAgentFileProtocol.js";
import { ILogger } from "../../../src/application/logging/ILogger.js";
import { IDatabaseRebuildService } from "../../../src/application/maintenance/db/rebuild/IDatabaseRebuildService.js";
import { MigrateDependenciesCommandHandler } from "../../../src/application/maintenance/migrate-dependencies/MigrateDependenciesCommandHandler.js";
import { UpgradeCommandHandler } from "../../../src/application/maintenance/upgrade/UpgradeCommandHandler.js";
import { ISettingsInitializer } from "../../../src/application/settings/ISettingsInitializer.js";
import { EvolveController } from "../../../src/application/evolve/EvolveController.js";

describe("EvolveController", () => {
  let controller: EvolveController;
  let runSchemaMigrations: jest.MockedFunction<() => Promise<void>>;
  let projectRootResolver: jest.Mocked<IProjectRootResolver>;
  let agentFileProtocol: jest.Mocked<IAgentFileProtocol>;
  let settingsInitializer: jest.Mocked<ISettingsInitializer>;
  let databaseRebuildService: jest.Mocked<IDatabaseRebuildService>;
  let upgradeCommandHandler: jest.Mocked<UpgradeCommandHandler>;
  let migrateDependenciesCommandHandler: jest.Mocked<MigrateDependenciesCommandHandler>;

  beforeEach(() => {
    runSchemaMigrations = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
    projectRootResolver = {
      resolve: jest.fn<IProjectRootResolver["resolve"]>().mockReturnValue("C:/repo"),
    } as jest.Mocked<IProjectRootResolver>;
    agentFileProtocol = {
      ensureAgentsMd: jest.fn(),
      ensureAgentConfigurations: jest.fn(),
      repairAgentsMd: jest.fn<IAgentFileProtocol["repairAgentsMd"]>().mockResolvedValue(undefined),
      repairAgentConfigurations: jest
        .fn<IAgentFileProtocol["repairAgentConfigurations"]>()
        .mockResolvedValue(undefined),
      getPlannedFileChanges: jest.fn(),
    } as jest.Mocked<IAgentFileProtocol>;
    settingsInitializer = {
      ensureSettingsFileExists: jest
        .fn<ISettingsInitializer["ensureSettingsFileExists"]>()
        .mockResolvedValue(undefined),
      getPlannedFileChange: jest.fn(),
    } as jest.Mocked<ISettingsInitializer>;
    databaseRebuildService = {
      rebuild: jest.fn<IDatabaseRebuildService["rebuild"]>().mockResolvedValue({
        eventsReplayed: 42,
        success: true,
      }),
    } as jest.Mocked<IDatabaseRebuildService>;
    upgradeCommandHandler = {
      handle: jest.fn<UpgradeCommandHandler["handle"]>().mockResolvedValue({
        migratedGoals: 3,
        eventsAppended: 3,
        success: true,
      }),
    } as jest.Mocked<UpgradeCommandHandler>;
    migrateDependenciesCommandHandler = {
      handle: jest.fn<MigrateDependenciesCommandHandler["handle"]>().mockResolvedValue({
        converted: [
          {
            dependencyId: "dep-1",
            relationId: "rel-1",
            fromEntityId: "component-a",
            toEntityId: "component-b",
          },
        ],
        skipped: [],
        totalLegacy: 1,
        dryRun: false,
      }),
    } as jest.Mocked<MigrateDependenciesCommandHandler>;

    const logger: ILogger = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    };

    controller = new EvolveController(
      runSchemaMigrations,
      upgradeCommandHandler,
      migrateDependenciesCommandHandler,
      projectRootResolver,
      agentFileProtocol,
      settingsInitializer,
      databaseRebuildService,
      logger
    );
  });

  it("orchestrates schema, migrations, files, settings, and rebuild in order", async () => {
    const response = await controller.handle();

    expect(runSchemaMigrations).toHaveBeenCalledTimes(1);
    expect(upgradeCommandHandler.handle).toHaveBeenCalledWith({ from: "v1", to: "v2" });
    expect(migrateDependenciesCommandHandler.handle).toHaveBeenCalledWith({ dryRun: false });
    expect(projectRootResolver.resolve).toHaveBeenCalledTimes(1);
    expect(agentFileProtocol.repairAgentsMd).toHaveBeenCalledWith("C:/repo");
    expect(agentFileProtocol.repairAgentConfigurations).toHaveBeenCalledWith("C:/repo");
    expect(settingsInitializer.ensureSettingsFileExists).toHaveBeenCalledTimes(1);
    expect(databaseRebuildService.rebuild).toHaveBeenCalledTimes(1);
    expect(response.steps.map((step) => step.name)).toEqual([
      "Schema migrations",
      "Goal status migration",
      "Legacy dependency migration",
      "AGENTS.md",
      "Agent configuration files",
      "Managed skills",
      "Harness configurations",
      "Settings",
      "Database projections",
    ]);
    expect(response.steps.every((step) => step.status === "repaired")).toBe(true);
  });

  it("skips database migrations and rebuild when schema migrations fail", async () => {
    runSchemaMigrations.mockRejectedValue(new Error("DDL failed"));

    const response = await controller.handle();

    expect(upgradeCommandHandler.handle).not.toHaveBeenCalled();
    expect(migrateDependenciesCommandHandler.handle).not.toHaveBeenCalled();
    expect(databaseRebuildService.rebuild).not.toHaveBeenCalled();
    expect(response.steps[0]).toEqual({
      name: "Schema migrations",
      status: "failed",
      detail: "DDL failed",
    });
    expect(response.steps[1]).toEqual({
      name: "Goal status migration",
      status: "skipped",
      detail: "Skipped because schema migrations failed.",
    });
    expect(response.steps[2]).toEqual({
      name: "Legacy dependency migration",
      status: "skipped",
      detail: "Skipped because schema migrations failed.",
    });
    expect(response.steps[8]).toEqual({
      name: "Database projections",
      status: "skipped",
      detail: "Skipped because one or more database migration steps failed.",
    });
    expect(agentFileProtocol.repairAgentsMd).toHaveBeenCalled();
    expect(settingsInitializer.ensureSettingsFileExists).toHaveBeenCalled();
  });

  it("skips rebuild when a data migration fails", async () => {
    upgradeCommandHandler.handle.mockRejectedValue(new Error("status migration failed"));

    const response = await controller.handle();

    expect(migrateDependenciesCommandHandler.handle).toHaveBeenCalled();
    expect(databaseRebuildService.rebuild).not.toHaveBeenCalled();
    expect(response.steps[1]).toEqual({
      name: "Goal status migration",
      status: "failed",
      detail: "status migration failed",
    });
    expect(response.steps[8]).toEqual({
      name: "Database projections",
      status: "skipped",
      detail: "Skipped because one or more database migration steps failed.",
    });
  });
});
