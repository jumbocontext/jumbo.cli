import React from "react";
import { Box, Text } from "ink";
import { BaseColors } from "../../shared/DesignTokens.js";
import { KeyBadge } from "../ui-primitives/KeyBadge.js";
import type { DaemonConfig, SubprocessSnapshot } from "../daemon-subprocesses/ISubprocessManager.js";
import { SubprocessStatus } from "../daemon-subprocesses/SubprocessStatus.js";
import { DAEMON_PANEL_CONTENT_WIDTH } from "./CockpitDaemonFrames.js";
import { CockpitDaemonPanelCopy } from "./CockpitDaemonPanelCopy.js";
import { getDaemonShortcutBadgeColor } from "./DaemonShortcutBadgeColor.js";

export function DaemonConfigWizard({
  snapshot,
  pendingConfig,
  selected,
}: {
  readonly snapshot: SubprocessSnapshot;
  readonly pendingConfig: DaemonConfig;
  readonly selected: boolean;
}): React.ReactElement {
  const config =
    snapshot.status === SubprocessStatus.RUNNING
      ? snapshot.config
      : pendingConfig;
  const badgeColor = getDaemonShortcutBadgeColor(selected);

  return (
    <Box width={DAEMON_PANEL_CONTENT_WIDTH} flexDirection="column">
      <Text color={BaseColors.shade4}>
        {CockpitDaemonPanelCopy.pidLabel} {snapshot.pid ?? "-"}
      </Text>
      <Box gap={1}>
        <KeyBadge
          char="a"
          label={config.agentId}
          color={badgeColor}
          labelColor={BaseColors.shade4}
        />
        <KeyBadge
          char="p"
          label={`${Math.round(config.pollIntervalMs / 1000)}s`}
          color={badgeColor}
          labelColor={BaseColors.shade4}
        />
        <KeyBadge
          char="x"
          label={String(config.maxRetries)}
          color={badgeColor}
          labelColor={BaseColors.shade4}
        />
      </Box>
    </Box>
  );
}
