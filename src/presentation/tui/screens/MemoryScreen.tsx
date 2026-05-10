import React from "react";
import { Box, Text } from "ink";
import { BaseColors, TuiColors, TuiGlyphs } from "../../shared/DesignTokens.js";

export function MemoryScreen(): React.ReactElement {
  return (
    <Box flexDirection="column" paddingX={1}>
      <Text color={BaseColors.brandBlue}>
        {TuiGlyphs.accentBar} Memory
      </Text>
      <Text color={TuiColors.muted}>
        Decisions, invariants, components, dependencies, guidelines
      </Text>
    </Box>
  );
}
