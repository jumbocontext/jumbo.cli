jest.mock("inquirer", () => ({
  prompt: jest.fn(),
}));

jest.mock("../../../../../../src/presentation/cli/banner/AnimatedBanner.js", () => ({
  getBannerLines: jest.fn(() => ["Jumbo"]),
  showAnimatedBanner: jest.fn().mockResolvedValue(undefined),
}));

import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import inquirer from "inquirer";
import { projectInit } from "../../../../../../src/presentation/cli/commands/project/init/project.init.js";
import { IApplicationContainer } from "../../../../../../src/application/host/IApplicationContainer.js";
import { Renderer } from "../../../../../../src/presentation/cli/rendering/Renderer.js";

describe("project.init command", () => {
  let mockContainer: Partial<IApplicationContainer>;
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let isTtyDescriptor: PropertyDescriptor | undefined;

  beforeEach(() => {
    (inquirer.prompt as jest.Mock).mockReset();

    mockContainer = {
      cliVersionReader: {
        getVersion: jest.fn().mockReturnValue({ version: "1.0.1" }),
      } as any,
      getTelemetryStatusController: {
        handle: jest.fn().mockResolvedValue({
          configured: false,
          enabled: false,
          effectiveEnabled: false,
          anonymousId: null,
          disabledByCi: false,
          disabledByEnvironment: false,
        }),
      } as any,
      updateTelemetryConsentController: {
        handle: jest.fn().mockResolvedValue({
          enabled: true,
          effectiveEnabled: true,
          anonymousId: "anon-123",
          disabledByCi: false,
          disabledByEnvironment: false,
          generatedAnonymousId: true,
        }),
      } as any,
      planProjectInitController: {
        handle: jest.fn().mockResolvedValue({
          plannedChanges: [],
        }),
      } as any,
      initializeProjectController: {
        handle: jest.fn().mockResolvedValue({
          projectId: "project_123",
          changes: [],
        }),
      } as any,
    };

    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    Renderer.reset();

    isTtyDescriptor = Object.getOwnPropertyDescriptor(process.stdout, "isTTY");
    Object.defineProperty(process.stdout, "isTTY", {
      configurable: true,
      value: true,
    });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    Renderer.reset();

    if (isTtyDescriptor) {
      Object.defineProperty(process.stdout, "isTTY", isTtyDescriptor);
    }
  });

  it("collects telemetry consent during interactive init", async () => {
    const promptMock = inquirer.prompt as jest.Mock;
    promptMock
      .mockResolvedValueOnce({ name: "Jumbo", purpose: "Telemetry" })
      .mockResolvedValueOnce({ enabled: true });

    await projectInit({ yolo: true }, mockContainer as IApplicationContainer);

    expect(
      mockContainer.getTelemetryStatusController!.handle
    ).toHaveBeenCalledWith({});
    expect(
      mockContainer.updateTelemetryConsentController!.handle
    ).toHaveBeenCalledWith({ enabled: true });
  });

  it("does not prompt for telemetry in non-interactive init", async () => {
    const promptMock = inquirer.prompt as jest.Mock;

    await projectInit(
      {
        nonInteractive: true,
        yolo: true,
        name: "Jumbo",
      },
      mockContainer as IApplicationContainer
    );

    expect(promptMock).not.toHaveBeenCalled();
    expect(
      mockContainer.updateTelemetryConsentController!.handle
    ).not.toHaveBeenCalled();
  });
});
