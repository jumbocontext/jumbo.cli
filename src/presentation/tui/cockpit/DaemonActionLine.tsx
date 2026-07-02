import React from "react";
import { Box } from "ink";
import { BaseColors } from "../../shared/DesignTokens.js";
import { KeyBadge } from "../ui-primitives/KeyBadge.js";
import type { SubprocessSnapshot } from "../daemon-subprocesses/ISubprocessManager.js";
import { SubprocessStatus } from "../daemon-subprocesses/SubprocessStatus.js";
import { DAEMON_PANEL_CONTENT_WIDTH } from "./CockpitDaemonFrames.js";
import { CockpitDaemonPanelCopy } from "./CockpitDaemonPanelCopy.js";
import { getDaemonShortcutBadgeColor } from "./DaemonShortcutBadgeColor.js";

export function DaemonActionLine({
  snapshot,
  selected,
  infoVisible,
}: {
  readonly snapshot: SubprocessSnapshot;
  readonly selected: boolean;
  readonly infoVisible: boolean;
}): React.ReactElement {
  const action = getDaemonAction(snapshot);
  const badgeColor = getDaemonShortcutBadgeColor(selected);

  return (
    <Box width={DAEMON_PANEL_CONTENT_WIDTH} marginTop={1} gap={1}>
      <KeyBadge
        char="s"
        label={action}
        color={badgeColor}
        labelColor={BaseColors.shade4}
      />
      <KeyBadge
        char="@"
        label={CockpitDaemonPanelCopy.action.config}
        color={badgeColor}
        labelColor={BaseColors.shade4}
      />
      <KeyBadge
        char="i"
        label={
          infoVisible
            ? CockpitDaemonPanelCopy.action.infoOpen
            : CockpitDaemonPanelCopy.action.info
        }
        color={badgeColor}
        labelColor={BaseColors.shade4}
      />
    </Box>
  );
}

function getDaemonAction(
  snapshot: SubprocessSnapshot,
): string {
  if (snapshot.status === SubprocessStatus.RUNNING) {
    return CockpitDaemonPanelCopy.action.stop;
  }

  if (snapshot.status === SubprocessStatus.STOPPING) {
    return CockpitDaemonPanelCopy.action.wait;
  }

  return CockpitDaemonPanelCopy.action.start;
}
