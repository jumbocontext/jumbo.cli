jest.mock("crypto", () => ({
  randomUUID: jest.fn(() => "generated-uuid"),
}));

import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { UpdateTelemetryConsentCommandHandler } from "../../../../../src/application/context/telemetry/update/UpdateTelemetryConsentCommandHandler.js";
import { ISettingsReader } from "../../../../../src/application/settings/ISettingsReader.js";

describe("UpdateTelemetryConsentCommandHandler", () => {
  let settingsReader: jest.Mocked<ISettingsReader>;
  let handler: UpdateTelemetryConsentCommandHandler;

  beforeEach(() => {
    settingsReader = {
      read: jest.fn(),
      write: jest.fn(),
      hasTelemetryConfiguration: jest.fn(),
    } as jest.Mocked<ISettingsReader>;

    handler = new UpdateTelemetryConsentCommandHandler(settingsReader);
  });

  it("generates an anonymous ID on first enable", async () => {
    settingsReader.read.mockResolvedValue({
      qa: { defaultTurnLimit: 3 },
      claims: { claimDurationMinutes: 30 },
      telemetry: { enabled: false, anonymousId: null },
    });

    const result = await handler.execute({ enabled: true });

    expect(result).toEqual({
      enabled: true,
      anonymousId: "generated-uuid",
      generatedAnonymousId: true,
    });
    expect(settingsReader.write).toHaveBeenCalledWith({
      qa: { defaultTurnLimit: 3 },
      claims: { claimDurationMinutes: 30 },
      telemetry: { enabled: true, anonymousId: "generated-uuid" },
    });
  });

  it("disables telemetry without replacing an existing anonymous ID", async () => {
    settingsReader.read.mockResolvedValue({
      qa: { defaultTurnLimit: 3 },
      claims: { claimDurationMinutes: 30 },
      telemetry: { enabled: true, anonymousId: "existing-id" },
    });

    const result = await handler.execute({ enabled: false });

    expect(result).toEqual({
      enabled: false,
      anonymousId: "existing-id",
      generatedAnonymousId: false,
    });
  });
});
