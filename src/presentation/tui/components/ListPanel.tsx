import React from "react";
import { Box, Text } from "ink";
import { BaseColors, TuiColors, TuiGlyphs } from "../../shared/DesignTokens.js";
import { Panel } from "./Panel.js";

interface ListPanelItem {
  label: string;
  detail?: string;
  color?: string;
}

interface ListPanelProps {
  title: string;
  items: ListPanelItem[];
  emptyMessage?: string;
  titleColor?: string;
  width?: number;
}

export function ListPanel({
  title,
  items,
  emptyMessage = "No items",
  titleColor,
  width,
}: ListPanelProps): React.ReactElement {
  return (
    <Panel title={title} titleColor={titleColor} width={width}>
      {items.length === 0 ? (
        <Text color={TuiColors.muted} italic>
          {emptyMessage}
        </Text>
      ) : (
        items.map((item) => (
          <Box key={item.label}>
            <Text color={item.color ?? TuiColors.accent}>
              {TuiGlyphs.bullet}{" "}
            </Text>
            <Text color={TuiColors.primary}>{item.label}</Text>
            {item.detail && (
              <Text color={TuiColors.muted}> {item.detail}</Text>
            )}
          </Box>
        ))
      )}
    </Panel>
  );
}
