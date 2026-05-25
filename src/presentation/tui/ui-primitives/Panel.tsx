import React from "react";
import { Box, Text } from "ink";
import { SemanticColors, TuiLayout } from "../../shared/DesignTokens.js";

interface PanelProps {
  title: string;
  titleColor?: string;
  borderColor?: string;
  width?: number;
  flexGrow?: number;
  flexBasis?: number;
  height?: string | number;
  bordered?: boolean;
  children: React.ReactNode;
}

export function Panel({
  title,
  titleColor = SemanticColors.headline,
  borderColor = SemanticColors.muted,
  width,
  flexGrow,
  flexBasis,
  height,
  bordered = true,
  children,
}: PanelProps): React.ReactElement {
  return (
    <Box
      flexDirection="column"
      borderStyle={bordered ? "round" : undefined}
      borderColor={borderColor}
      paddingX={bordered ? 1 : 0}
      minWidth={TuiLayout.panelMinWidth}
      width={width}
      flexGrow={flexGrow}
      flexBasis={flexBasis}
      height={height}
    >
      {title ? (
        <React.Fragment>
          <Text color={titleColor} bold>
            {title}
          </Text>
          <Box flexDirection="column" marginTop={1}>
            {children}
          </Box>
        </React.Fragment>
      ) : (
        <Box flexDirection="column">{children}</Box>
      )}
    </Box>
  );
}
