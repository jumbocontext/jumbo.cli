import { afterEach, describe, expect, it, jest } from "@jest/globals";
import fs from "fs-extra";
import * as os from "os";
import * as path from "path";
import { Host } from "../../../src/infrastructure/host/Host.js";
import { NoOpTelemetryClient } from "../../../src/infrastructure/telemetry/NoOpTelemetryClient.js";
import {
  POSTHOG_SHUTDOWN_TIMEOUT_MS,
} from "../../../src/infrastructure/telemetry/PostHogTelemetryConstants.js";
import { PostHogTelemetryClient } from "../../../src/infrastructure/telemetry/PostHogTelemetryClient.js";
import { CI_ENVIRONMENT_VARIABLE_NAMES, TELEMETRY_DISABLED_ENVIRONMENT_VARIABLE } from "../../../src/infrastructure/telemetry/TelemetryEnvironmentVariables.js";

describe("PostHogTelemetryClient", () => {
  afterEach(() => {
    delete process.env[TELEMETRY_DISABLED_ENVIRONMENT_VARIABLE];
  });

  it("captures events with the anonymous identifier", () => {
    const capture = jest.fn();
    const client = new PostHogTelemetryClient("anon-123", () => ({
      capture,
      shutdown: jest.fn(),
    }));

    client.track("goal_started", { source: "test" });

    expect(capture).toHaveBeenCalledWith({
      distinctId: "anon-123",
      event: "goal_started",
      properties: { source: "test" },
    });
  });

  it("swallows SDK capture errors", () => {
    const client = new PostHogTelemetryClient("anon-123", () => ({
      capture: () => {
        throw new Error("capture failed");
      },
      shutdown: jest.fn(),
    }));

    expect(() => client.track("goal_started", { source: "test" })).not.toThrow();
  });

  it("delegates flush to PostHog shutdown with timeout", async () => {
    const shutdown = jest.fn().mockResolvedValue(undefined);
    const client = new PostHogTelemetryClient("anon-123", () => ({
      capture: jest.fn(),
      shutdown,
    }));

    await expect(client.flush()).resolves.toBeUndefined();
    expect(shutdown).toHaveBeenCalledWith(POSTHOG_SHUTDOWN_TIMEOUT_MS);
  });

  it("swallows SDK shutdown errors", async () => {
    const client = new PostHogTelemetryClient("anon-123", () => ({
      capture: jest.fn(),
      shutdown: () => {
        throw new Error("shutdown failed");
      },
    }));

    await expect(client.shutdown()).resolves.toBeUndefined();
  });

  it("wires PostHogTelemetryClient when telemetry is effectively enabled (no-ops without API key)", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "jumbo-telemetry-"));
    const host = new Host(tempDir);
    const savedCiVars: Record<string, string | undefined> = {};
    for (const name of CI_ENVIRONMENT_VARIABLE_NAMES) {
      savedCiVars[name] = process.env[name];
      delete process.env[name];
    }

    try {
      await fs.writeFile(
        path.join(tempDir, "settings.jsonc"),
        JSON.stringify({
          qa: { defaultTurnLimit: 3 },
          claims: { claimDurationMinutes: 30 },
          telemetry: {
            enabled: true,
            anonymousId: "anon-123",
            consentGiven: true,
          },
        })
      );

      const container = await host.createBuilder().build();

      // HostBuilder wires PostHogTelemetryClient when consent is given.
      // Without POSTHOG_API_KEY in the environment the client silently
      // no-ops (postHogClient is null), which is the expected local/test
      // behavior. The published npm package has the key baked in at build time.
      expect(container.telemetryClient).toBeInstanceOf(PostHogTelemetryClient);
    } finally {
      for (const [name, value] of Object.entries(savedCiVars)) {
        if (value !== undefined) process.env[name] = value;
        else delete process.env[name];
      }
      host.dispose();
      await fs.remove(tempDir);
    }
  });

  it("falls back to NoOpTelemetryClient when environment disables telemetry", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "jumbo-telemetry-"));
    const host = new Host(tempDir);
    process.env[TELEMETRY_DISABLED_ENVIRONMENT_VARIABLE] = "1";

    try {
      await fs.writeFile(
        path.join(tempDir, "settings.jsonc"),
        JSON.stringify({
          qa: { defaultTurnLimit: 3 },
          claims: { claimDurationMinutes: 30 },
          telemetry: {
            enabled: true,
            anonymousId: "anon-123",
            consentGiven: true,
          },
        })
      );

      const container = await host.createBuilder().build();

      expect(container.telemetryClient).toBeInstanceOf(NoOpTelemetryClient);
    } finally {
      host.dispose();
      await fs.remove(tempDir);
    }
  });
});
