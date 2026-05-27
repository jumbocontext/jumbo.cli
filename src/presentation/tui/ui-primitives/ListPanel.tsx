import React from "react";
import { Box, Text } from "ink";
import {
  SemanticColors,
  TuiGlyphs,
  TuiLayout,
} from "../../shared/DesignTokens.js";
import { Panel } from "./Panel.js";
import { ListPanelCopy } from "./ListPanelConstants.js";

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
  emptyMessage = ListPanelCopy.emptyMessage,
  titleColor,
  width,
}: ListPanelProps): React.ReactElement {
  return (
    <Panel
      title={title}
      titleColor={titleColor}
      width={width ?? TuiLayout.listPanelWidth}
    >
      {items.length === 0 ? (
        <Text color={SemanticColors.muted} italic>
          {emptyMessage}
        </Text>
      ) : (
        items.map((item) => (
          <Box key={item.label}>
            <Text color={item.color ?? SemanticColors.accent}>
              {TuiGlyphs.bullet}{" "}
            </Text>
            <Text color={SemanticColors.primary}>{item.label}</Text>
            {item.detail && (
              <Text color={SemanticColors.muted}> {item.detail}</Text>
            )}
          </Box>
        ))
      )}
    </Panel>
  );
}
