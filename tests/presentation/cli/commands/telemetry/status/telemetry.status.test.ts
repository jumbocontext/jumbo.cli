import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { telemetryStatus } from "../../../../../../src/presentation/cli/commands/telemetry/status/telemetry.status.js";
import { IApplicationContainer } from "../../../../../../src/application/host/IApplicationContainer.js";
import { Renderer } from "../../../../../../src/presentation/cli/rendering/Renderer.js";

describe("telemetry.status command", () => {
  let mockContainer: Partial<IApplicationContainer>;
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    mockContainer = {
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

    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    Renderer.reset();
  });

  it("renders text output with consent state and anonymous ID", async () => {
    Renderer.configure({ format: "text", verbosity: "normal" });

    await telemetryStatus({}, mockContainer as IApplicationContainer);

    const output = consoleLogSpy.mock.calls.map((call) => String(call[0])).join("\n");
    expect(output).toContain("Telemetry status");
    expect(output).toContain("Anonymous ID: anon-123");
  });

  it("renders structured output in json mode", async () => {
    Renderer.configure({ format: "json", verbosity: "normal" });

    await telemetryStatus({}, mockContainer as IApplicationContainer);

    const parsed = JSON.parse(String(consoleLogSpy.mock.calls[0][0]));
    expect(parsed.anonymousId).toBe("anon-123");
    expect(parsed.effectiveEnabled).toBe(true);
  });
});
