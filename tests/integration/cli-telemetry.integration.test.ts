import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { IApplicationContainer } from "../../src/application/host/IApplicationContainer.js";
import { AppRunner } from "../../src/presentation/cli/AppRunner.js";
import { Renderer } from "../../src/presentation/cli/rendering/Renderer.js";

describe("CLI telemetry integration", () => {
  let originalArgv: string[];
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    originalArgv = [...process.argv];
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    process.argv = originalArgv;
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    Renderer.reset();
    jest.restoreAllMocks();
  });

  it("tracks telemetry when a registered command executes end-to-end", async () => {
    const track = jest.fn();
    const container: Partial<IApplicationContainer> = {
      telemetryClient: {
        track,
        flush: jest.fn().mockResolvedValue(undefined),
        shutdown: jest.fn().mockResolvedValue(undefined),
      },
      getTelemetryStatusController: {
        handle: jest.fn().mockResolvedValue({
          configured: true,
          enabled: true,
          effectiveEnabled: true,
          anonymousId: "anon-123",
          disabledByCi: false,
          disabledByEnvironment: false,
        }),
      } as any,
    };

    process.argv = ["node", "jumbo", "telemetry", "status"];

    const runner = new AppRunner("9.9.9", container as IApplicationContainer);
    await runner.run();

    expect(track).toHaveBeenCalledWith(
      "cli_command_executed",
      expect.objectContaining({
        commandName: "telemetry status",
        cliVersion: "9.9.9",
        success: true,
      })
    );
  });
});
