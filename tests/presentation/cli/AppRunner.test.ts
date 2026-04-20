import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";

jest.unstable_mockModule("../../../src/presentation/cli/program/ProgramFactory.js", () => ({
  createProgram: jest.fn(),
}));

jest.unstable_mockModule("../../../src/presentation/cli/program/GlobalOptionsHandler.js", () => ({
  attachGlobalOptions: jest.fn(),
}));

jest.unstable_mockModule(
  "../../../src/presentation/cli/commands/registry/CommanderApplicator.js",
  () => ({
    CommanderApplicator: jest.fn().mockImplementation(() => ({
      apply: jest.fn(),
    })),
  })
);

jest.unstable_mockModule(
  "../../../src/presentation/cli/commands/registry/generated-commands.js",
  () => ({
    commands: [
      {
        path: "telemetry status",
        metadata: {
          description: "Show telemetry status",
          requiresProject: false,
        },
        handler: jest.fn(),
      },
    ],
  })
);

const { createProgram } = await import("../../../src/presentation/cli/program/ProgramFactory.js");
import type { IApplicationContainer } from "../../../src/application/host/IApplicationContainer.js";
const { AppRunner } = await import("../../../src/presentation/cli/AppRunner.js");
import { Renderer } from "../../../src/presentation/cli/rendering/Renderer.js";

describe("AppRunner", () => {
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
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it("tracks successful command execution with command metadata", async () => {
    const track = jest.fn();
    const shutdown = jest.fn().mockResolvedValue(undefined);
    const container: Partial<IApplicationContainer> = {
      telemetryClient: {
        track,
        flush: jest.fn().mockResolvedValue(undefined),
        shutdown,
      },
    };
    const parseAsync = jest.fn().mockResolvedValue(undefined);

    (createProgram as jest.Mock).mockReturnValue({
      parseAsync,
      outputHelp: jest.fn(),
    });

    process.argv = ["node", "jumbo", "telemetry", "status"];

    const runner = new AppRunner("1.2.3", container as IApplicationContainer);
    await runner.run();

    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith(
      "cli_command_executed",
      expect.objectContaining({
        commandName: "telemetry status",
        cliVersion: "1.2.3",
        nodeVersion: process.version,
        osPlatform: process.platform,
        osArch: process.arch,
        success: true,
      })
    );
    expect(track.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        durationMs: expect.any(Number),
      })
    );
    expect(shutdown).not.toHaveBeenCalled();
  });

  it("tracks process exit failures and flushes telemetry before exiting", async () => {
    const track = jest.fn();
    const shutdown = jest.fn().mockResolvedValue(undefined);
    const container: Partial<IApplicationContainer> = {
      telemetryClient: {
        track,
        flush: jest.fn().mockResolvedValue(undefined),
        shutdown,
      },
    };

    (createProgram as jest.Mock).mockReturnValue({
      parseAsync: jest.fn().mockImplementation(async () => {
        process.exit(1);
      }),
      outputHelp: jest.fn(),
    });

    process.argv = ["node", "jumbo", "telemetry", "status"];

    const processExitSpy = jest
      .spyOn(process, "exit")
      .mockImplementation((code?: string | number | null) => {
        throw new Error(`process.exit called with code ${code}`);
      });

    const runner = new AppRunner("1.2.3", container as IApplicationContainer);

    await expect(runner.run()).rejects.toThrow("process.exit called with code 1");

    expect(track).toHaveBeenCalledWith(
      "cli_command_executed",
      expect.objectContaining({
        commandName: "telemetry status",
        success: false,
        errorType: "ProcessExit",
      })
    );
    expect(shutdown).toHaveBeenCalledTimes(1);
    expect(shutdown.mock.invocationCallOrder[0]).toBeLessThan(
      processExitSpy.mock.invocationCallOrder[0]
    );
  });

  it("captures thrown error types before exiting", async () => {
    const track = jest.fn();
    const shutdown = jest.fn().mockResolvedValue(undefined);
    const container: Partial<IApplicationContainer> = {
      telemetryClient: {
        track,
        flush: jest.fn().mockResolvedValue(undefined),
        shutdown,
      },
    };

    (createProgram as jest.Mock).mockReturnValue({
      parseAsync: jest.fn().mockRejectedValue(new TypeError("boom")),
      outputHelp: jest.fn(),
    });

    process.argv = ["node", "jumbo", "telemetry", "status"];

    const processExitSpy = jest
      .spyOn(process, "exit")
      .mockImplementation((code?: string | number | null) => {
        throw new Error(`process.exit called with code ${code}`);
      });

    const runner = new AppRunner("1.2.3", container as IApplicationContainer);

    await expect(runner.run()).rejects.toThrow("process.exit called with code 1");

    expect(track).toHaveBeenCalledWith(
      "cli_command_executed",
      expect.objectContaining({
        commandName: "telemetry status",
        success: false,
        errorType: "TypeError",
      })
    );
    expect(shutdown).toHaveBeenCalledTimes(1);
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });
});
