import type { TuiDaemonConfig } from "../daemon-subprocesses/ISubprocessManager.js";

const COCKPIT_DAEMON_POLL_INTERVAL_OPTIONS_MS = [10_000, 30_000, 60_000, 120_000] as const;

export function getNextCockpitDaemonPollConfig(config: TuiDaemonConfig): TuiDaemonConfig {
  const currentIndex = COCKPIT_DAEMON_POLL_INTERVAL_OPTIONS_MS.indexOf(
    config.pollIntervalMs as typeof COCKPIT_DAEMON_POLL_INTERVAL_OPTIONS_MS[number],
  );
  const nextIndex = currentIndex === -1
    ? 0
    : (currentIndex + 1) % COCKPIT_DAEMON_POLL_INTERVAL_OPTIONS_MS.length;

  return { ...config, pollIntervalMs: COCKPIT_DAEMON_POLL_INTERVAL_OPTIONS_MS[nextIndex] };
}
