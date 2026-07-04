import React, { useEffect, useState } from "react";
import { Box, Text, useInput } from "ink";
import { SemanticColors } from "../../../shared/DesignTokens.js";
import { KeyBadge } from "../../ui-primitives/KeyBadge.js";
import { HorizontalRule } from "../../ui-primitives/HorizontalRule.js";
import { EntityDetailView } from "./EntityDetailView.js";
import type {
  ComponentEntityRow,
  DecisionEntityRow,
  DependencyEntityRow,
  GuidelineEntityRow,
  InvariantEntityRow,
  MemoryEntityRow,
  MemoryEntityType,
} from "./MemoryEntityShapes.js";

const EMPTY_POSITION_INDICATOR = "0/0";
const MEMORY_ENTITY_SCREEN_COPY = {
  showingLabel: "Showing:",
  scrollBadge: "↑↓",
  loadingPrefix: "Loading",
  emptySuffix: "available",
} as const;

interface MemoryEntityScreenProps {
  readonly entityType: MemoryEntityType;
  readonly title: string;
  readonly rows: readonly MemoryEntityRow[];
  readonly loading?: boolean;
  readonly error?: Error | null;
  readonly shortcutsEnabled?: boolean;
}

export function MemoryEntityScreen({
  entityType,
  title,
  rows,
  loading = false,
  error = null,
  shortcutsEnabled = true,
}: MemoryEntityScreenProps): React.ReactElement {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const focusedEntity = rows[focusedIndex] ?? rows[0];
  const positionIndicator =
    focusedEntity === undefined
      ? EMPTY_POSITION_INDICATOR
      : `${Math.min(focusedIndex, rows.length - 1) + 1}/${rows.length}`;

  useEffect(() => {
    setFocusedIndex((currentIndex) => {
      if (rows.length === 0) {
        return 0;
      }

      return Math.min(currentIndex, rows.length - 1);
    });
  }, [rows.length]);

  useInput(
    (_input, key) => {
      if (rows.length === 0) {
        return;
      }

      if (key.upArrow) {
        setFocusedIndex((currentIndex) =>
          wrapIndex(currentIndex - 1, rows.length),
        );
        return;
      }

      if (key.downArrow) {
        setFocusedIndex((currentIndex) =>
          wrapIndex(currentIndex + 1, rows.length),
        );
      }
    },
    { isActive: shortcutsEnabled },
  );

  return (
    <Box flexDirection="column" paddingTop={1}>
      <Box flexDirection="column" paddingX={1}>
        <Text color={SemanticColors.h2} bold>
          {title}
        </Text>

        <Box>
          <Text color={SemanticColors.label}>
            {MEMORY_ENTITY_SCREEN_COPY.showingLabel}{" "}
          </Text>
          <Text color={SemanticColors.primary}>{positionIndicator}</Text>
          <KeyBadge char={MEMORY_ENTITY_SCREEN_COPY.scrollBadge} />
        </Box>
      </Box>

      <HorizontalRule color={SemanticColors.label} />

      <Box flexDirection="column" paddingX={1}>
        {error !== null ? (
          <Text color={SemanticColors.error}>{error.message}</Text>
        ) : loading && focusedEntity === undefined ? (
          <Text color={SemanticColors.muted}>
            {MEMORY_ENTITY_SCREEN_COPY.loadingPrefix} {title.toLowerCase()}
          </Text>
        ) : focusedEntity === undefined ? (
          <Text color={SemanticColors.muted} italic>
            No {title.toLowerCase()} {MEMORY_ENTITY_SCREEN_COPY.emptySuffix}
          </Text>
        ) : (
          <EntityDetailView
            entityType={entityType}
            entity={focusedEntity}
            heading={labelForRow(entityType, focusedEntity)}
          />
        )}
      </Box>
    </Box>
  );
}

function wrapIndex(index: number, itemCount: number): number {
  return (index + itemCount) % itemCount;
}

function labelForRow(entityType: MemoryEntityType, row: MemoryEntityRow): string {
  switch (entityType) {
    case "decision":
      return (row as DecisionEntityRow).title;
    case "invariant":
      return (row as InvariantEntityRow).title;
    case "component":
      return (row as ComponentEntityRow).name;
    case "dependency":
      return (row as DependencyEntityRow).name;
    case "guideline":
      return (row as GuidelineEntityRow).title;
  }
}
