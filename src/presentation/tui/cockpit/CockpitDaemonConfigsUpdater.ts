import type {
  DaemonConfig,
  DaemonConfigs,
  DaemonName,
} from "../daemon-subprocesses/ISubprocessManager.js";

export function updateSelectedCockpitDaemonConfig(
  configs: DaemonConfigs,
  selectedDaemon: DaemonName,
  nextConfig: (config: DaemonConfig) => DaemonConfig,
): DaemonConfigs {
  return {
    ...configs,
    [selectedDaemon]: nextConfig(configs[selectedDaemon]),
  };
}
