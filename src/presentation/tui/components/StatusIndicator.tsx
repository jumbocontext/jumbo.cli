import React from "react";
import { Box, Text } from "ink";
import { BaseColors, TuiColors, TuiGlyphs } from "../../shared/DesignTokens.js";

export type StatusLevel = "active" | "idle" | "off" | "error";

const STATUS_COLORS: Record<StatusLevel, string> = {
  active: TuiColors.success,
  idle: TuiColors.info,
  off: TuiColors.muted,
  error: TuiColors.error,
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
      <Text color={TuiColors.primary}>{label}: </Text>
      <Text color={color}>{status}</Text>
    </Box>
  );
}
