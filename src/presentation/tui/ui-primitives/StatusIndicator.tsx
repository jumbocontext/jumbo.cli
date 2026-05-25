import React from "react";
import { Box, Text } from "ink";
import { SemanticColors, TuiGlyphs } from "../../shared/DesignTokens.js";

export type StatusLevel = "active" | "idle" | "off" | "error";

const STATUS_COLORS: Record<StatusLevel, string> = {
  active: SemanticColors.success,
  idle: SemanticColors.info,
  off: SemanticColors.muted,
  error: SemanticColors.error,
};

interface StatusIndicatorProps {
  label: string;
  status: StatusLevel;
}

export function StatusIndicator({
  label,
  status,
}: StatusIndicatorProps): React.ReactElement {
  const color = STATUS_COLORS[status];

  return (
    <Box>
      <Text color={color}>{TuiGlyphs.filledCircle} </Text>
      <Text color={SemanticColors.primary}>{label}: </Text>
      <Text color={color}>{status}</Text>
    </Box>
  );
}
