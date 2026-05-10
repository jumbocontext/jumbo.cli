import React from "react";
import { Box, Text } from "ink";
import { BaseColors, TuiColors } from "../../shared/DesignTokens.js";

interface PanelProps {
  title: string;
  titleColor?: string;
  borderColor?: string;
  width?: number;
  children: React.ReactNode;
}

export function Panel({
  title,
  titleColor = TuiColors.headline,
  borderColor = TuiColors.muted,
  width,
  children,
}: PanelProps): React.ReactElement {
  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={borderColor}
      paddingX={1}
      width={width}
    >
      <Text color={titleColor} bold>
        {title}
      </Text>
      <Box flexDirection="column" marginTop={1}>
        {children}
      </Box>
    </Box>
  );
}
