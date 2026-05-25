import React from "react";
import { Box, Text } from "ink";
import { SemanticColors } from "../../shared/DesignTokens.js";
import { Panel } from "./Panel.js";

interface DetailPaneEntry {
  label: string;
  value: string;
  valueColor?: string;
}

interface DetailPaneProps {
  title: string;
  entries: DetailPaneEntry[];
  titleColor?: string;
  width?: number;
}

export function DetailPane({
  title,
  entries,
  titleColor,
  width,
}: DetailPaneProps): React.ReactElement {
  return (
    <Panel title={title} titleColor={titleColor} width={width}>
      {entries.map((entry) => (
        <Box key={entry.label}>
          <Text color={SemanticColors.muted}>{entry.label}: </Text>
          <Text color={entry.valueColor ?? SemanticColors.primary}>
            {entry.value}
          </Text>
        </Box>
      ))}
    </Panel>
  );
}
