import { jest, describe, expect, it, beforeEach } from "@jest/globals";
import type React from "react";

const mockWaitUntilExit = jest.fn<() => Promise<void>>().mockResolvedValue();
const mockRender = jest.fn(() => ({
  waitUntilExit: mockWaitUntilExit,
}));

jest.unstable_mockModule("ink", () => ({
  render: mockRender,
}));

jest.unstable_mockModule("../../../src/presentation/tui/TuiApp.js", () => ({
  TuiApp: () => null,
}));

const { TuiApplicationLauncher } = await import(
  "../../../src/presentation/tui/TuiApplicationLauncher.js"
);
import type { IApplicationContainer } from "../../../src/application/host/IApplicationContainer.js";

describe("TuiApplicationLauncher", () => {
  beforeEach(() => {
    mockRender.mockClear();
    mockWaitUntilExit.mockClear();
  });

  it("launches TuiApp with no state readers when no container exists", async () => {
    const launcher = new TuiApplicationLauncher("1.2.3", null);

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

  it("maps container controllers into TUI state reader controllers", async () => {
    const container: Partial<IApplicationContainer> = {
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
      planProjectInitController: { handle: jest.fn() },
      initializeProjectController: { handle: jest.fn() },
      addAudienceController: { handle: jest.fn() },
      addValuePropositionController: { handle: jest.fn() },
    };

    const launcher = new TuiApplicationLauncher(
      "1.2.3",
      container as IApplicationContainer,
    );

    await launcher.launch();

    const element = mockRender.mock.calls[0][0] as React.ReactElement<{
      stateReaderControllers: {
        getProjectSummaryQueryHandler: object;
        getGoalsController: object;
        getSessionsController: object;
      };
      actionControllers: {
        planProjectInitController: object;
        initializeProjectController: object;
        addAudienceController: object;
        addValuePropositionController: object;
      };
    }>;
    expect(element.props.stateReaderControllers.getProjectSummaryQueryHandler)
      .toBeDefined();
    expect(element.props.stateReaderControllers.getGoalsController).toBe(
      container.getGoalsController,
    );
    expect(element.props.stateReaderControllers.getSessionsController).toBe(
      container.getSessionsController,
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
  });
});
