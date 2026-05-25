import { describe, expect, it } from "@jest/globals";
import {
  getNextFocusedDaemon,
  nextAgentConfig,
  nextDaemonConfigs,
  nextPollConfig,
  nextRetryConfig,
} from "../../../../src/presentation/tui/cockpit/CockpitDaemonConfiguration.js";
import { DEFAULT_WORKER_DAEMON_CONFIGS } from "../../../../src/application/daemons/WorkerDaemonCatalog.js";

describe("CockpitDaemonConfiguration", () => {
  it("cycles daemon focus in launchpad order", () => {
    expect(getNextFocusedDaemon("refiner")).toBe("reviewer");
    expect(getNextFocusedDaemon("reviewer")).toBe("codifier");
    expect(getNextFocusedDaemon("codifier")).toBe("refiner");
  });

  it("cycles configured daemon agent, poll interval, and retries", () => {
    expect(nextAgentConfig({ agentId: "codex", pollIntervalMs: 30000, maxRetries: 3 }).agentId).toBe("claude");
    expect(nextPollConfig({ agentId: "codex", pollIntervalMs: 30000, maxRetries: 3 }).pollIntervalMs).toBe(60000);
    expect(nextRetryConfig({ agentId: "codex", pollIntervalMs: 30000, maxRetries: 3 }).maxRetries).toBe(5);
  });

  it("updates only the selected daemon config", () => {
    const configs = nextDaemonConfigs(
      DEFAULT_WORKER_DAEMON_CONFIGS,
      "reviewer",
      (config) => ({ ...config, agentId: "claude" }),
    );

    expect(configs.reviewer.agentId).toBe("claude");
    expect(configs.refiner).toBe(DEFAULT_WORKER_DAEMON_CONFIGS.refiner);
    expect(configs.codifier).toBe(DEFAULT_WORKER_DAEMON_CONFIGS.codifier);
  });
});
