import type { TuiDaemonConfig } from "../daemon-subprocesses/ISubprocessManager.js";

const COCKPIT_DAEMON_RETRY_OPTIONS = [1, 2, 3, 5] as const;

export function getNextCockpitDaemonRetryConfig(config: TuiDaemonConfig): TuiDaemonConfig {
  const currentIndex = COCKPIT_DAEMON_RETRY_OPTIONS.indexOf(
    config.maxRetries as typeof COCKPIT_DAEMON_RETRY_OPTIONS[number],
  );
  const nextIndex = currentIndex === -1
    ? 0
    : (currentIndex + 1) % COCKPIT_DAEMON_RETRY_OPTIONS.length;

  return { ...config, maxRetries: COCKPIT_DAEMON_RETRY_OPTIONS[nextIndex] };
}
