import React from "react";
import { Box, Text } from "ink";
import { TuiColors, TuiGlyphs } from "../../shared/DesignTokens.js";

interface FooterProps {
  terminalWidth: number;
}

export function Footer({ terminalWidth }: FooterProps): React.ReactElement {
  return (
    <Box flexDirection="column" width={terminalWidth}>
      <Text color={TuiColors.muted} dimColor>
        {TuiGlyphs.divider.repeat(terminalWidth)}
      </Text>
      <Box justifyContent="space-between" paddingX={1}>
        <Text color={TuiColors.muted}>
          m menu {TuiGlyphs.dot} q quit
        </Text>
        <Text color={TuiColors.muted}>
          {TuiGlyphs.filledCircle} daemons: idle
        </Text>
      </Box>
    </Box>
  );
}
