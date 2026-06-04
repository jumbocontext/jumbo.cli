import type {
  TuiDaemonConfig,
  TuiDaemonConfigs,
  TuiDaemonName,
} from "../daemon-subprocesses/ISubprocessManager.js";

export function updateSelectedCockpitDaemonConfig(
  configs: TuiDaemonConfigs,
  selectedDaemon: TuiDaemonName,
  nextConfig: (config: TuiDaemonConfig) => TuiDaemonConfig,
): TuiDaemonConfigs {
  return {
    ...configs,
    [selectedDaemon]: nextConfig(configs[selectedDaemon]),
  };
}
