import { jest, describe, expect, it, beforeEach } from "@jest/globals";
import type React from "react";

const mockWaitUntilExit = jest.fn<() => Promise<void>>().mockResolvedValue();
const mockRender = jest.fn(() => ({
  waitUntilExit: mockWaitUntilExit,
}));

jest.unstable_mockModule("ink", () => ({
  render: mockRender,
}));

jest.unstable_mockModule("../../../../src/presentation/tui/application-shell/App.js", () => ({
  App: () => null,
}));

const { ApplicationLauncher } = await import(
  "../../../../src/presentation/tui/application-shell/ApplicationLauncher.js"
);
import type { IApplicationContainer } from "../../../../src/application/host/IApplicationContainer.js";

describe("ApplicationLauncher", () => {
  beforeEach(() => {
    mockRender.mockClear();
    mockWaitUntilExit.mockClear();
  });

  it("launches App with no state readers when no container exists", async () => {
    const launcher = new ApplicationLauncher("1.2.3", null);

    await launcher.launch();

    expect(mockRender).toHaveBeenCalledTimes(1);
    expect(mockWaitUntilExit).toHaveBeenCalledTimes(1);
    const element = mockRender.mock.calls[0][0] as React.ReactElement<{
      version: string;
      stateReaderControllers: object;
    }>;
    expect(element.props.version).toBe("1.2.3");
    expect(element.props.stateReaderControllers).toEqual({});
  });

  it("passes fallback init action controllers when no container exists", async () => {
    const actionControllers = {
      planProjectInitController: { handle: jest.fn() },
    };
    const launcher = new ApplicationLauncher(
      "1.2.3",
      null,
      actionControllers,
    );

    await launcher.launch();

    const element = mockRender.mock.calls[0][0] as React.ReactElement<{
      actionControllers: object;
    }>;
    expect(element.props.actionControllers).toBe(actionControllers);
  });

  it("passes fallback state reader factory when no container exists", async () => {
    const factory = jest.fn<() => Promise<object>>().mockResolvedValue({});
    const launcher = new ApplicationLauncher(
      "1.2.3",
      null,
      {},
      factory,
    );

    await launcher.launch();

    const element = mockRender.mock.calls[0][0] as React.ReactElement<{
      onProjectInitialized: object;
    }>;
    expect(element.props.onProjectInitialized).toBe(factory);
  });

  it("passes the launcher directory path into App", async () => {
    const launcher = new ApplicationLauncher(
      "1.2.3",
      null,
      {},
      undefined,
      undefined,
      "C:\\projects\\jumbo\\cli",
    );

    await launcher.launch();

    const element = mockRender.mock.calls[0][0] as React.ReactElement<{
      directoryPath: string;
    }>;
    expect(element.props.directoryPath).toBe("C:\\projects\\jumbo\\cli");
  });

  it("receives the subprocess manager through a launcher factory", async () => {
    const subprocessManager = {
      spawn: jest.fn(),
      terminate: jest.fn(),
      terminateAll: jest.fn(),
      getStatus: jest.fn(),
      getAllStatuses: jest.fn(() => []),
    };
    const factory = jest.fn(() => subprocessManager);
    const launcher = new ApplicationLauncher(
      "1.2.3",
      null,
      {},
      undefined,
      factory,
    );

    await launcher.launch();

    const element = mockRender.mock.calls[0][0] as React.ReactElement<{
      subprocessManager: object;
    }>;
    expect(factory).toHaveBeenCalledWith(undefined);
    expect(element.props.subprocessManager).toBe(subprocessManager);
  });

  it("maps container controllers into TUI state reader controllers", async () => {
    const cliUpdateController = {
      check: jest.fn(),
      upgrade: jest.fn(),
    };
    const container: Partial<IApplicationContainer> = {
      settingsReader: {
        read: jest.fn(),
        write: jest.fn(),
        hasTelemetryConfiguration: jest.fn(),
      },
      projectContextReader: {
        getProject: jest.fn(),
        getProjectLifecycleState: jest.fn(),
      },
      getGoalsController: { handle: jest.fn() },
      getSessionsController: { handle: jest.fn() },
      getComponentsController: { handle: jest.fn() },
      getDecisionsController: { handle: jest.fn() },
      getDependenciesController: { handle: jest.fn() },
      getGuidelinesController: { handle: jest.fn() },
      getInvariantsController: { getAllInvariants: jest.fn() },
      projectStatsController: { handle: jest.fn() },
      planProjectInitController: { handle: jest.fn() },
      initializeProjectController: { handle: jest.fn() },
      addAudienceController: { handle: jest.fn() },
      addValuePropositionController: { handle: jest.fn() },
      cliUpdateController: cliUpdateController as never,
    };

    const launcher = new ApplicationLauncher(
      "1.2.3",
      container as IApplicationContainer,
    );

    await launcher.launch();

    const element = mockRender.mock.calls[0][0] as React.ReactElement<{
      stateReaderControllers: {
        getProjectSummaryQueryHandler: object;
        getGoalsController: object;
        getSessionsController: object;
        projectStatsController: object;
      };
      actionControllers: {
        planProjectInitController: object;
        initializeProjectController: object;
        addAudienceController: object;
        addValuePropositionController: object;
      };
      settingsReader: object;
      cliUpdateController: object;
    }>;
    expect(element.props.stateReaderControllers.getProjectSummaryQueryHandler)
      .toBeDefined();
    expect(element.props.stateReaderControllers.getGoalsController).toBe(
      container.getGoalsController,
    );
    expect(element.props.stateReaderControllers.getSessionsController).toBe(
      container.getSessionsController,
    );
    expect(element.props.stateReaderControllers.projectStatsController).toBe(
      container.projectStatsController,
    );
    expect(element.props.actionControllers.planProjectInitController).toBe(
      container.planProjectInitController,
    );
    expect(element.props.actionControllers.initializeProjectController).toBe(
      container.initializeProjectController,
    );
    expect(element.props.actionControllers.addAudienceController).toBe(
      container.addAudienceController,
    );
    expect(element.props.actionControllers.addValuePropositionController).toBe(
      container.addValuePropositionController,
    );
    expect(element.props.settingsReader).toBe(container.settingsReader);
    expect(element.props.cliUpdateController).toBe(cliUpdateController);
  });

  it("passes an explicit update controller into App", async () => {
    const cliUpdateController = {
      check: jest.fn(),
      upgrade: jest.fn(),
    };
    const launcher = new ApplicationLauncher(
      "1.2.3",
      null,
      {},
      undefined,
      undefined,
      "C:\\projects\\jumbo\\cli",
      cliUpdateController,
    );

    await launcher.launch();

    const element = mockRender.mock.calls[0][0] as React.ReactElement<{
      cliUpdateController: object;
    }>;
    expect(element.props.cliUpdateController).toBe(cliUpdateController);
  });
});
