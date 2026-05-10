import React from "react";
import { Box, Text } from "ink";
import { TuiColors, TuiGlyphs } from "../../shared/DesignTokens.js";
import { KeyBadge } from "./KeyBadge.js";

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
        <Box gap={2}>
          <KeyBadge char="m" label="menu" />
          <KeyBadge char="q" label="quit" />
          <KeyBadge char="h" label="help" />
        </Box>
        <Box alignItems="center">
          <Text color={TuiColors.muted}>
            {TuiGlyphs.filledCircle} daemons: idle
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
