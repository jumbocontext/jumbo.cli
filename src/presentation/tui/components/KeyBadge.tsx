import React from "react";
import { Box, Text } from "ink";
import { TuiColors } from "../../shared/DesignTokens.js";

interface KeyBadgeProps {
  char: string;
  label?: string;
}

export function KeyBadge({ char, label }: KeyBadgeProps): React.ReactElement {
  return (
    <Box alignItems="center" gap={1}>
      <Box borderStyle="round" borderColor={TuiColors.keyBadge} backgroundColor={TuiColors.keyBadgeBackground} paddingLeft={1} paddingRight={1}>
        <Text color={TuiColors.keyBadge} bold>{char}</Text>
      </Box>
      {label !== undefined && <Text color={TuiColors.muted}>{label}</Text>}
    </Box>
  );
}
