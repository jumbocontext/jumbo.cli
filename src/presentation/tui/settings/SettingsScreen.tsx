import React from "react";
import { Box, Text } from "ink";
import { SemanticColors } from "../../shared/DesignTokens.js";
import { Panel } from "../ui-primitives/Panel.js";

const SETTINGS_SCREEN_COPY = {
  title: "Settings",
  placeholder: "Settings are not editable from the TUI yet.",
} as const;

export function SettingsScreen(): React.ReactElement {
  return (
    <Box flexDirection="column" paddingX={1} paddingTop={1}>
      <Panel title={SETTINGS_SCREEN_COPY.title}>
        <Text color={SemanticColors.muted}>
          {SETTINGS_SCREEN_COPY.placeholder}
        </Text>
      </Panel>
    </Box>
  );
}
