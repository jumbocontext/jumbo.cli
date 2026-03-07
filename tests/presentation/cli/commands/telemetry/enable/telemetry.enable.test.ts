import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { telemetryEnable } from "../../../../../../src/presentation/cli/commands/telemetry/enable/telemetry.enable.js";
import { IApplicationContainer } from "../../../../../../src/application/host/IApplicationContainer.js";
import { Renderer } from "../../../../../../src/presentation/cli/rendering/Renderer.js";

describe("telemetry.enable command", () => {
  let mockContainer: Partial<IApplicationContainer>;
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    mockContainer = {
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
    };

    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    Renderer.reset();
  });

  it("renders text output when telemetry is enabled", async () => {
    Renderer.configure({ format: "text", verbosity: "normal" });

    await telemetryEnable({}, mockContainer as IApplicationContainer);

    const output = consoleLogSpy.mock.calls.map((call) => String(call[0])).join("\n");
    expect(output).toContain("Telemetry enabled");
    expect(output).toContain("Anonymous ID: anon-123");
  });
});
