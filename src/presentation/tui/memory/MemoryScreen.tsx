import React from "react";
import { Box, Text } from "ink";
import { SemanticColors } from "../../shared/DesignTokens.js";
import { Panel } from "../ui-primitives/Panel.js";

export function MemoryScreen(): React.ReactElement {
  return (
    <Box flexDirection="column" paddingX={1} paddingTop={1} gap={1}>
      <Box flexDirection="column">
        <Text color={SemanticColors.headline} bold>
          Memory
        </Text>
        <Text color={SemanticColors.secondary}>
          Memory browsing now uses dedicated entity screens.
        </Text>
      </Box>
      <Panel title="Dedicated Screens">
        <Text color={SemanticColors.primary}>
          Open Decisions, Invariants, Components, Dependencies, or Guidelines
          from the menu.
        </Text>
      </Panel>
    </Box>
  );
}
