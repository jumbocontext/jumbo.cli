import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import {
  BaseColors,
  SemanticColors,
  TuiGlyphs,
} from "../../shared/DesignTokens.js";
import {
  SCREEN_DEFINITIONS,
  type ScreenKey,
} from "./ScreenDefinitions.js";
import {
  MEGA_MENU_SECTIONS,
  MAX_MENU_DEPTH,
} from "./MegaMenuDefinitions.js";
import type { MegaMenuItem, MegaMenuSection } from "./MegaMenuDefinitions.js";

interface MegaMenuProps {
  activeScreenIndex: number;
  onScreenSelect: (index: number) => void;
  onClose: () => void;
  terminalWidth: number;
}

const COLUMN_WIDTH = 24;
const MEGA_MENU_COPY = {
  title: "Navigate",
  hints: {
    drill: "drill",
    select: "enter select",
    back: "back",
    close: "close",
  },
} as const;

function screenIndexForKey(screenKey: ScreenKey): number {
  return SCREEN_DEFINITIONS.findIndex((screen) => screen.key === screenKey);
}

function activeScreenKeyForIndex(activeScreenIndex: number): ScreenKey {
  return (
    SCREEN_DEFINITIONS[activeScreenIndex]?.key ?? SCREEN_DEFINITIONS[0].key
  );
}

function itemContainsScreenKey(
  item: MegaMenuSection | MegaMenuItem,
  activeScreenKey: ScreenKey,
): boolean {
  if (item.screenKey === activeScreenKey) {
    return true;
  }

  return item.children?.some((child) =>
    itemContainsScreenKey(child, activeScreenKey),
  ) ?? false;
}

function highlightedPathForScreenKey(
  activeScreenKey: ScreenKey,
): [number, number, number] {
  const sectionIndex = MEGA_MENU_SECTIONS.findIndex((section) =>
    itemContainsScreenKey(section, activeScreenKey),
  );
  if (sectionIndex < 0) {
    return [0, 0, 0];
  }

  const section = MEGA_MENU_SECTIONS[sectionIndex];
  const childIndex = section.children.findIndex((child) =>
    itemContainsScreenKey(child, activeScreenKey),
  );
  const child = childIndex >= 0 ? section.children[childIndex] : undefined;
  const grandchildIndex =
    child?.children?.findIndex((grandchild) =>
      itemContainsScreenKey(grandchild, activeScreenKey),
    ) ?? -1;

  return [
    sectionIndex,
    childIndex < 0 ? 0 : childIndex,
    grandchildIndex < 0 ? 0 : grandchildIndex,
  ];
}

function getItemsAtLevel(
  level: number,
  highlightedIndices: readonly number[],
): readonly (MegaMenuSection | MegaMenuItem)[] {
  if (level === 0) {
    return MEGA_MENU_SECTIONS;
  }

  let items: readonly (MegaMenuSection | MegaMenuItem)[] = MEGA_MENU_SECTIONS;
  for (let i = 0; i < level; i++) {
    const parent = items[highlightedIndices[i]];
    if (!parent || !("children" in parent) || !parent.children) {
      return [];
    }
    items = parent.children;
  }
  return items;
}

function MenuColumn({
  items,
  highlightedIndex,
  activeLevel,
  columnLevel,
  activeScreenIndex,
}: {
  items: readonly (MegaMenuSection | MegaMenuItem)[];
  highlightedIndex: number;
  activeLevel: number;
  columnLevel: number;
  activeScreenIndex: number;
}): React.ReactElement {
  const isActiveColumn = columnLevel === activeLevel;
  const activeScreenKey = activeScreenKeyForIndex(activeScreenIndex);

  return (
    <Box flexDirection="column" width={COLUMN_WIDTH}>
      {items.map((item, index) => {
        const isHighlighted = isActiveColumn && index === highlightedIndex;
        const isCurrentScreen = itemContainsScreenKey(item, activeScreenKey);
        const hasChildren =
          "children" in item && item.children && item.children.length > 0;

        return (
          <Box key={item.key}>
            <Text
              color={
                isHighlighted
                  ? BaseColors.brandBlue
                  : isActiveColumn
                    ? SemanticColors.primary
                    : SemanticColors.muted
              }
              bold={isHighlighted}
            >
              {isHighlighted ? TuiGlyphs.selector : " "}{" "}
              {isCurrentScreen ? "[" : ""}
              {item.label}
              {isCurrentScreen ? "]" : ""}
              {hasChildren && isHighlighted ? ` ${TuiGlyphs.arrow}` : ""}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}

export function MegaMenu({
  activeScreenIndex,
  onScreenSelect,
  onClose,
  terminalWidth,
}: MegaMenuProps): React.ReactElement {
  const activeScreenKey = activeScreenKeyForIndex(activeScreenIndex);
  const [activeLevel, setActiveLevel] = useState(0);
  const [highlightedIndices, setHighlightedIndices] = useState<
    [number, number, number]
  >(highlightedPathForScreenKey(activeScreenKey));

  const currentItems = getItemsAtLevel(activeLevel, highlightedIndices);
  const highlightedItem = currentItems[highlightedIndices[activeLevel]];

  useInput((input, key) => {
    if (key.escape) {
      if (activeLevel > 0) {
        setActiveLevel((prev) => prev - 1);
      } else {
        onClose();
      }
      return;
    }

    if (key.return) {
      if (highlightedItem?.screenKey) {
        const screenIndex = screenIndexForKey(highlightedItem.screenKey);
        if (screenIndex >= 0) {
          onScreenSelect(screenIndex);
        }
        return;
      }

      if (
        highlightedItem &&
        "children" in highlightedItem &&
        highlightedItem.children &&
        highlightedItem.children.length > 0 &&
        activeLevel < MAX_MENU_DEPTH - 1
      ) {
        setActiveLevel((prev) => prev + 1);
      }
      return;
    }

    if (key.upArrow) {
      setHighlightedIndices((prev) => {
        const next = [...prev] as [number, number, number];
        if (next[activeLevel] > 0) {
          next[activeLevel] -= 1;
          for (let i = activeLevel + 1; i < MAX_MENU_DEPTH; i++) {
            next[i] = 0;
          }
        }
        return next;
      });
      return;
    }

    if (key.downArrow) {
      setHighlightedIndices((prev) => {
        const next = [...prev] as [number, number, number];
        if (next[activeLevel] < currentItems.length - 1) {
          next[activeLevel] += 1;
          for (let i = activeLevel + 1; i < MAX_MENU_DEPTH; i++) {
            next[i] = 0;
          }
        }
        return next;
      });
      return;
    }

    if (key.rightArrow && activeLevel < MAX_MENU_DEPTH - 1) {
      const nextItems = getItemsAtLevel(activeLevel + 1, highlightedIndices);
      if (nextItems.length > 0) {
        setActiveLevel((prev) => prev + 1);
      }
      return;
    }

    if (key.leftArrow && activeLevel > 0) {
      setActiveLevel((prev) => prev - 1);
      return;
    }

  });

  return (
    <Box
      flexDirection="column"
      width={terminalWidth}
      borderStyle="single"
      borderColor={SemanticColors.muted}
      paddingX={1}
    >
      <Box marginBottom={1}>
        <Text color={SemanticColors.headline} bold>
          {MEGA_MENU_COPY.title}
        </Text>
      </Box>
      <Box>
        {[0, 1, 2].map((level) => {
          const items = getItemsAtLevel(level, highlightedIndices);
          if (items.length === 0) {
            return (
              <Box key={level} width={COLUMN_WIDTH}>
                <Text color={SemanticColors.muted}> </Text>
              </Box>
            );
          }

          return (
            <React.Fragment key={level}>
              {level > 0 && (
                <Box marginX={1}>
                  <Text color={SemanticColors.muted}>{TuiGlyphs.accentBar}</Text>
                </Box>
              )}
              <MenuColumn
                items={items}
                highlightedIndex={highlightedIndices[level]}
                activeLevel={activeLevel}
                columnLevel={level}
                activeScreenIndex={activeScreenIndex}
              />
            </React.Fragment>
          );
        })}
      </Box>
      <Box marginTop={1}>
        <Text color={SemanticColors.muted}>
          ←→ {MEGA_MENU_COPY.hints.drill} {TuiGlyphs.dot}{" "}
          {MEGA_MENU_COPY.hints.select} {TuiGlyphs.dot} esc{" "}
          {activeLevel > 0
            ? MEGA_MENU_COPY.hints.back
            : MEGA_MENU_COPY.hints.close}
        </Text>
      </Box>
    </Box>
  );
}
