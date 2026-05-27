import type { TuiDaemonConfig, TuiDaemonConfigs, TuiDaemonName } from "../daemon-subprocesses/ISubprocessManager.js";

const AGENT_OPTIONS = ["codex", "claude", "gemini", "copilot", "cursor", "vibe"] as const;
const POLL_INTERVAL_OPTIONS_MS = [10_000, 30_000, 60_000, 120_000] as const;
const RETRY_OPTIONS = [1, 2, 3, 5] as const;

export function getNextFocusedDaemon(
  currentDaemon: TuiDaemonName,
  focusOrder: readonly TuiDaemonName[],
): TuiDaemonName {
  const currentIndex = focusOrder.indexOf(currentDaemon);
  const nextIndex = currentIndex === -1
    ? 0
    : (currentIndex + 1) % focusOrder.length;

  return focusOrder[nextIndex];
}

export function nextAgentConfig(config: TuiDaemonConfig): TuiDaemonConfig {
  const currentIndex = AGENT_OPTIONS.indexOf(config.agentId as typeof AGENT_OPTIONS[number]);
  const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % AGENT_OPTIONS.length;
  return { ...config, agentId: AGENT_OPTIONS[nextIndex] };
}

export function nextPollConfig(config: TuiDaemonConfig): TuiDaemonConfig {
  const currentIndex = POLL_INTERVAL_OPTIONS_MS.indexOf(config.pollIntervalMs as typeof POLL_INTERVAL_OPTIONS_MS[number]);
  const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % POLL_INTERVAL_OPTIONS_MS.length;
  return { ...config, pollIntervalMs: POLL_INTERVAL_OPTIONS_MS[nextIndex] };
}

export function nextRetryConfig(config: TuiDaemonConfig): TuiDaemonConfig {
  const currentIndex = RETRY_OPTIONS.indexOf(config.maxRetries as typeof RETRY_OPTIONS[number]);
  const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % RETRY_OPTIONS.length;
  return { ...config, maxRetries: RETRY_OPTIONS[nextIndex] };
}

export function nextDaemonConfigs(
  configs: TuiDaemonConfigs,
  selectedDaemon: TuiDaemonName,
  nextConfig: (config: TuiDaemonConfig) => TuiDaemonConfig,
): TuiDaemonConfigs {
  return {
    ...configs,
    [selectedDaemon]: nextConfig(configs[selectedDaemon]),
  };
}
