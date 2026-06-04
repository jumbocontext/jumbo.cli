import React from "react";
import { Box, Text } from "ink";
import { BaseColors } from "../../shared/DesignTokens.js";
import { CockpitDaemonPanelCopy } from "./CockpitDaemonPanelCopy.js";
import type { IDaemonConstants } from "./daemons/IDaemonConstants.js";

export function DaemonInfoOverlay({
  daemonConstants,
}: {
  readonly daemonConstants: IDaemonConstants;
}): React.ReactElement {
  const info = daemonConstants.info;

  return (
    <Box
      borderStyle="round"
      borderColor={BaseColors.brandBlue}
      flexDirection="column"
      marginBottom={1}
      paddingX={1}
      width="100%"
    >
      <Text color={BaseColors.brandBlue} bold>
        {info.title}
      </Text>
      {info.lines.map((line) => (
        <Text key={line} color={BaseColors.shade2}>
          {line}
        </Text>
      ))}
      <Text color={BaseColors.shade4}>
        {CockpitDaemonPanelCopy.closeInfoLabel}
      </Text>
    </Box>
  );
}
