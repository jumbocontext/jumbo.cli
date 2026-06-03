import React from "react";
import { Box, Text } from "ink";
import { BaseColors } from "../../shared/DesignTokens.js";
import { CockpitDaemonEvents } from "./CockpitDaemonEvents.js";
import type { DaemonEventRow } from "./DaemonEventRow.js";
import { CockpitLaunchpadCopy } from "./CockpitLaunchpadCopy.js";

interface CockpitLaunchpadEventLogProps {
  readonly rows: readonly DaemonEventRow[];
}

export function CockpitLaunchpadEventLog({
  rows,
}: CockpitLaunchpadEventLogProps): React.ReactElement {
  return (
    <Box flexDirection="column">
      <Text color={BaseColors.shade2} bold>
        {CockpitLaunchpadCopy.eventsHeading}
      </Text>
      <Box flexDirection="column" marginTop={1}>
        {rows.map((row) => (
          <Text key={row.key} color={row.color}>
            {CockpitDaemonEvents.formatRow(row)}
          </Text>
        ))}
      </Box>
    </Box>
  );
}
