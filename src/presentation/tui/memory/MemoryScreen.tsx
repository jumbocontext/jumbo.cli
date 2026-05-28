import React from "react";
import { Box, Text } from "ink";
import { SemanticColors } from "../../shared/DesignTokens.js";
import { Panel } from "../ui-primitives/Panel.js";

const MEMORY_SCREEN_COPY = {
  title: "Memory",
  subtitle: "Memory browsing now uses dedicated entity screens.",
  dedicatedScreensTitle: "Dedicated Screens",
  dedicatedScreensPrompt:
    "Open Decisions, Invariants, Components, Dependencies, or Guidelines from the menu.",
} as const;

export function MemoryScreen(): React.ReactElement {
  return (
    <Box flexDirection="column" paddingX={1} paddingTop={1} gap={1}>
      <Box flexDirection="column">
        <Text color={SemanticColors.headline} bold>
          {MEMORY_SCREEN_COPY.title}
        </Text>
        <Text color={SemanticColors.secondary}>
          {MEMORY_SCREEN_COPY.subtitle}
        </Text>
      </Box>
      <Panel title={MEMORY_SCREEN_COPY.dedicatedScreensTitle}>
        <Text color={SemanticColors.primary}>
          {MEMORY_SCREEN_COPY.dedicatedScreensPrompt}
        </Text>
      </Panel>
    </Box>
  );
}
