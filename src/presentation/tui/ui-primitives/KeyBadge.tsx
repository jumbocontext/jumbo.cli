import React from "react";
import { Box, Text } from "ink";
import { SemanticColors } from "../../shared/DesignTokens.js";

interface KeyBadgeProps {
  char: string;
  label?: string;
  compact?: boolean;
  color?: string;
  labelColor?: string;
}

export function KeyBadge({
  char,
  label,
  compact = false,
  color = SemanticColors.keyBadge,
  labelColor = SemanticColors.muted,
}: KeyBadgeProps): React.ReactElement {
  return (
    <Box alignItems="center" gap={1}>
      <Text
        backgroundColor={SemanticColors.keyBadgeBackground}
        color={color}
        bold
      >
        {compact ? char : ` ${char} `}
      </Text>
      {label !== undefined && <Text color={labelColor}>{label}</Text>}
    </Box>
  );
}
