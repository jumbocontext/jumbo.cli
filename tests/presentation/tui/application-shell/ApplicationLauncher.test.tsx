import { jest, describe, expect, it, beforeEach, afterEach } from "@jest/globals";
import type React from "react";

const mockWaitUntilExit = jest.fn<() => Promise<void>>();
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
import type { ILogger } from "../../../../src/application/logging/ILogger.js";
import type { ISubprocessManager } from "../../../../src/presentation/tui/daemon-subprocesses/ISubprocessManager.js";

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("ApplicationLauncher", () => {
  beforeEach(() => {
    mockWaitUntilExit.mockReset();
    mockWaitUntilExit.mockResolvedValue();
    mockRender.mockReset();
    mockRender.mockReturnValue({
      waitUntilExit: mockWaitUntilExit,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const subprocessManager = (
    terminateAll: jest.MockedFunction<() => Promise<void>> = jest
      .fn<() => Promise<void>>()
      .mockResolvedValue(),
  ): ISubprocessManager => ({
    spawn: jest.fn(),
    terminate: jest.fn(),
    terminateAll,
    getStatus: jest.fn(),
    getAllStatuses: jest.fn(() => []),
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
    const manager = subprocessManager();
    const factory = jest.fn(() => manager);
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
    expect(element.props.subprocessManager).toBe(manager);
  });

  it("creates one subprocess manager per launch and terminates it after Ink exits", async () => {
    const terminateAll = jest.fn<() => Promise<void>>().mockResolvedValue();
    const manager = subprocessManager(terminateAll);
    const factory = jest.fn(() => manager);
    const launcher = new ApplicationLauncher(
      "1.2.3",
      null,
      {},
      undefined,
      factory,
    );

    await launcher.launch();

    expect(factory).toHaveBeenCalledTimes(1);
    expect(mockWaitUntilExit).toHaveBeenCalledTimes(1);
    expect(terminateAll).toHaveBeenCalledTimes(1);
    expect(mockWaitUntilExit.mock.invocationCallOrder[0]).toBeLessThan(
      terminateAll.mock.invocationCallOrder[0],
    );
  });

  it("terminates subprocesses when Ink launch fails", async () => {
    const terminateAll = jest.fn<() => Promise<void>>().mockResolvedValue();
    const manager = subprocessManager(terminateAll);
    const launchError = new Error("render failed");
    mockRender.mockImplementationOnce(() => {
      throw launchError;
    });
    const launcher = new ApplicationLauncher(
      "1.2.3",
      null,
      {},
      undefined,
      () => manager,
    );

    await expect(launcher.launch()).rejects.toBe(launchError);

    expect(terminateAll).toHaveBeenCalledTimes(1);
  });

  it("logs and rejects when subprocess cleanup fails after Ink exits", async () => {
    const cleanupError = new Error("cleanup failed");
    const terminateAll = jest.fn<() => Promise<void>>().mockRejectedValue(
      cleanupError,
    );
    const logger: ILogger = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    };
    const container: Partial<IApplicationContainer> = {
      logger,
    };
    const launcher = new ApplicationLauncher(
      "1.2.3",
      container as IApplicationContainer,
      {},
      undefined,
      () => subprocessManager(terminateAll),
    );

    await expect(launcher.launch()).rejects.toBe(cleanupError);

    expect(logger.error).toHaveBeenCalledWith(
      "TUI daemon subprocess shutdown failed",
      cleanupError,
      { reason: "ink-exit" },
    );
  });

  it("preserves waitUntilExit and cleanup failures when both fail", async () => {
    const waitError = new Error("wait failed");
    const cleanupError = new Error("cleanup failed");
    const terminateAll = jest.fn<() => Promise<void>>().mockRejectedValue(
      cleanupError,
    );
    mockWaitUntilExit.mockRejectedValueOnce(waitError);
    const launcher = new ApplicationLauncher(
      "1.2.3",
      null,
      {},
      undefined,
      () => subprocessManager(terminateAll),
    );

    await expect(launcher.launch()).rejects.toMatchObject({
      message:
        "Application launcher failed during TUI exit and daemon subprocess cleanup.",
      errors: [waitError, cleanupError],
    });
  });

  it("awaits signal-driven cleanup before exiting and removes shutdown handlers", async () => {
    let finishWaitUntilExit: (() => void) | undefined;
    let finishCleanup: (() => void) | undefined;
    const waitUntilExitReleased = new Promise<void>((resolve) => {
      finishWaitUntilExit = resolve;
    });
    const cleanupReleased = new Promise<void>((resolve) => {
      finishCleanup = resolve;
    });
    const handlers = new Map<string | symbol, Array<(...args: unknown[]) => void>>();
    const terminateAll = jest.fn(async () => {
      await cleanupReleased;
    });
    const processOnSpy = jest
      .spyOn(process, "on")
      .mockImplementation((event, handler) => {
        const eventHandlers = handlers.get(event) ?? [];
        eventHandlers.push(handler as (...args: unknown[]) => void);
        handlers.set(event, eventHandlers);
        return process;
      });
    const processOffSpy = jest
      .spyOn(process, "off")
      .mockImplementation((event, handler) => {
        handlers.set(
          event,
          (handlers.get(event) ?? []).filter(
            (registered) => registered !== handler,
          ),
        );
        return process;
      });
    const processExitSpy = jest
      .spyOn(process, "exit")
      .mockImplementation(((_code?: string | number | null) => undefined) as never);
    mockWaitUntilExit.mockReturnValueOnce(waitUntilExitReleased);
    const launcher = new ApplicationLauncher(
      "1.2.3",
      null,
      {},
      undefined,
      () => subprocessManager(terminateAll),
    );

    const launchPromise = launcher.launch();
    await tick();

    const signalHandler = handlers.get("SIGTERM")?.[0];
    expect(signalHandler).toBeDefined();
    signalHandler?.();
    await tick();

    expect(terminateAll).toHaveBeenCalledTimes(1);
    expect(processExitSpy).not.toHaveBeenCalled();

    finishCleanup?.();
    await tick();

    expect(processExitSpy).toHaveBeenCalledWith(143);
    expect(processOffSpy).toHaveBeenCalledWith("beforeExit", expect.any(Function));
    expect(processOffSpy).toHaveBeenCalledWith("SIGINT", expect.any(Function));
    expect(processOffSpy).toHaveBeenCalledWith("SIGTERM", expect.any(Function));
    expect(processOffSpy).toHaveBeenCalledWith("SIGHUP", expect.any(Function));

    finishWaitUntilExit?.();
    await launchPromise;
    expect(terminateAll).toHaveBeenCalledTimes(1);
    expect(processOnSpy).toHaveBeenCalledWith("beforeExit", expect.any(Function));
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
