import React, { useEffect, useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";
import {
  BaseColors,
  SemanticColors,
  TuiGlyphs,
  TuiLayout,
} from "../../shared/DesignTokens.js";
import { Panel } from "./Panel.js";
import { TumblerCopy } from "./TumblerConstants.js";

export interface TumblerItem {
  readonly key: string;
  readonly value: string;
}

export interface TumblerProps {
  readonly title?: string;
  readonly items: readonly TumblerItem[];
  readonly initialFocusedKey?: string;
  readonly visibleCount?: number;
  readonly maxDisplayLength?: number;
  readonly width?: number;
  readonly isActive?: boolean;
  readonly emptyMessage?: string;
  readonly onFocusedItemChange?: (item: TumblerItem) => void;
}

function normalizeVisibleCount(visibleCount: number): number {
  const wholeCount = Math.max(1, Math.floor(visibleCount));
  return wholeCount % 2 === 0 ? wholeCount + 1 : wholeCount;
}

function focusedIndexForKey(
  items: readonly TumblerItem[],
  initialFocusedKey?: string,
): number {
  if (!initialFocusedKey) {
    return 0;
  }

  const requestedIndex = items.findIndex(
    (item) => item.key === initialFocusedKey,
  );
  return requestedIndex < 0 ? 0 : requestedIndex;
}

function wrapIndex(index: number, itemCount: number): number {
  return (index + itemCount) % itemCount;
}

interface TumblerRow {
  readonly item: TumblerItem;
  readonly distanceFromFocus: number;
}

function getVisibleRows(
  items: readonly TumblerItem[],
  focusedIndex: number,
  visibleCount: number,
): readonly TumblerRow[] {
  if (items.length === 0) {
    return [];
  }

  const normalizedVisibleCount = Math.min(
    normalizeVisibleCount(visibleCount),
    items.length,
  );
  const radius = Math.floor(normalizedVisibleCount / 2);

  return Array.from({ length: normalizedVisibleCount }, (_, rowIndex) => {
    const distanceFromFocus = rowIndex - radius;
    return {
      item: items[wrapIndex(focusedIndex + distanceFromFocus, items.length)],
      distanceFromFocus,
    };
  });
}

function colorForDistance(distanceFromFocus: number): string {
  const distance = Math.abs(distanceFromFocus);
  if (distance === 0) {
    return SemanticColors.primary;
  }
  if (distance === 1) {
    return BaseColors.shade4;
  }
  return BaseColors.shade6;
}

function truncateValue(value: string, maxDisplayLength?: number): string {
  if (maxDisplayLength === undefined) {
    return value;
  }

  const normalizedMaxLength = Math.max(0, Math.floor(maxDisplayLength));
  if (value.length <= normalizedMaxLength) {
    return value;
  }

  if (normalizedMaxLength <= 3) {
    return ".".repeat(normalizedMaxLength);
  }

  return `${value.slice(0, normalizedMaxLength - 3)}...`;
}

export function Tumbler({
  title,
  items,
  initialFocusedKey,
  visibleCount = 5,
  maxDisplayLength,
  width = TuiLayout.listPanelWidth,
  isActive = true,
  emptyMessage = TumblerCopy.emptyMessage,
  onFocusedItemChange,
}: TumblerProps): React.ReactElement {
  const [focusedIndex, setFocusedIndex] = useState(() =>
    focusedIndexForKey(items, initialFocusedKey),
  );
  const normalizedVisibleCount = normalizeVisibleCount(visibleCount);

  useEffect(() => {
    setFocusedIndex((currentIndex) => {
      if (items.length === 0) {
        return 0;
      }
      return Math.min(currentIndex, items.length - 1);
    });
  }, [items.length]);

  useInput(
    (_input, key) => {
      if (items.length === 0) {
        return;
      }

      if (key.upArrow) {
        setFocusedIndex((currentIndex) =>
          wrapIndex(currentIndex - 1, items.length),
        );
        return;
      }

      if (key.downArrow) {
        setFocusedIndex((currentIndex) =>
          wrapIndex(currentIndex + 1, items.length),
        );
      }
    },
    { isActive },
  );

  const visibleRows = useMemo(
    () => getVisibleRows(items, focusedIndex, normalizedVisibleCount),
    [focusedIndex, items, normalizedVisibleCount],
  );

  const focusedItem = items[focusedIndex];
  useEffect(() => {
    if (focusedItem) {
      onFocusedItemChange?.(focusedItem);
    }
  }, [focusedItem, onFocusedItemChange]);

  const content =
    items.length === 0 ? (
      <Text color={SemanticColors.muted} italic>
        {emptyMessage}
      </Text>
    ) : (
      <Box flexDirection="column">
        {visibleRows.map(({ item, distanceFromFocus }) => {
          const isFocused = distanceFromFocus === 0;
          return (
            <Box key={`${item.key}-${distanceFromFocus}`}>
              <Text
                color={
                  isActive && isFocused
                    ? BaseColors.brandBlue
                    : colorForDistance(distanceFromFocus)
                }
                bold={isFocused}
              >
                {isFocused ? TuiGlyphs.selector : " "}{" "}
              </Text>
              <Text color={colorForDistance(distanceFromFocus)} bold={isFocused}>
                {truncateValue(item.value, maxDisplayLength)}
              </Text>
            </Box>
          );
        })}
      </Box>
    );

  if (title) {
    return (
      <Panel title={title} width={width}>
        {content}
      </Panel>
    );
  }

  return (
    <Box flexDirection="column" width={width}>
      {content}
    </Box>
  );
}
