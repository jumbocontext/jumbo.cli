import React from "react";
import { Box, Text } from "ink";
import { SemanticColors, TuiGlyphs } from "../../../shared/DesignTokens.js";
import { Panel } from "../../ui-primitives/Panel.js";

interface EntityColumnProps {
  readonly title: string;
  readonly entries: readonly { readonly id: string; readonly label: string }[];
  readonly selectedId: string | undefined;
  readonly isActive: boolean;
  readonly width?: number;
}

export function EntityColumn({
  title,
  entries,
  selectedId,
  isActive,
  width,
}: EntityColumnProps): React.ReactElement {
  const titleColor = isActive
    ? SemanticColors.accent
    : SemanticColors.headline;
  return (
    <Panel title={title} titleColor={titleColor} width={width}>
      {entries.length === 0 ? (
        <Text color={SemanticColors.muted}>No entries</Text>
      ) : (
        entries.map((entry) => {
          const isSelected = isActive && entry.id === selectedId;
          const rowColor = isSelected
            ? SemanticColors.accent
            : SemanticColors.primary;
          return (
            <Box key={entry.id}>
              <Text color={rowColor}>
                {isSelected ? TuiGlyphs.selector : " "}
              </Text>
              <Text color={rowColor}> {entry.label}</Text>
            </Box>
          );
        })
      )}
    </Panel>
  );
}
