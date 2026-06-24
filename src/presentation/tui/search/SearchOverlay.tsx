import React, { useEffect, useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";
import type { SearchHit } from "../../../application/context/search/SearchHit.js";
import { SemanticColors } from "../../shared/DesignTokens.js";
import { KeyBadge } from "../ui-primitives/KeyBadge.js";
import { Panel } from "../ui-primitives/Panel.js";
import { useGlobalSearch } from "../state-reading/useGlobalSearch.js";
import { SearchResultDetail } from "./SearchResultDetail.js";
import { flattenSearchHits } from "./SearchHits.js";
import { resolveSearchHitGroups } from "./SearchHitGroups.js";
import { SearchResultsView } from "./SearchResultsView.js";

const SEARCH_OVERLAY_COPY = {
  title: "Search",
  errorTitle: "Search Error",
  promptPrefix: "/",
  placeholder: "search memory",
  hints: {
    select: "select result",
    close: "close",
    text: "type search",
  },
} as const;

interface SearchOverlayProps {
  readonly onClose: () => void;
  readonly terminalWidth?: number;
  readonly terminalHeight?: number;
}

export function SearchOverlay({
  onClose,
  terminalWidth = 80,
  terminalHeight = 24,
}: SearchOverlayProps): React.ReactElement {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchState = useGlobalSearch();
  const groups = useMemo(
    () => resolveSearchHitGroups(searchState.data),
    [searchState.data],
  );
  const hits = useMemo(() => flattenSearchHits(groups), [groups]);
  const selectedHit: SearchHit | undefined = hits[selectedIndex];
  const hasQuery = query.trim().length > 0;

  useEffect(() => {
    setSelectedIndex(0);
    void searchState.search(query);
  }, [query, searchState.search]);

  useInput((input, key) => {
    if (key.escape) {
      onClose();
      return;
    }

    if (key.downArrow) {
      setSelectedIndex((current) =>
        Math.min(current + 1, Math.max(0, hits.length - 1)),
      );
      return;
    }

    if (key.upArrow) {
      setSelectedIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (key.backspace || key.delete) {
      setQuery((current) => current.slice(0, -1));
      return;
    }

    if (key.return || key.tab || key.ctrl || key.meta) {
      return;
    }

    if (input.length > 0) {
      setQuery((current) => `${current}${input}`);
    }
  });

  return (
    <Box
      width="100%"
      height="100%"
      position="relative"
    >
      <Box flexDirection="column" position="absolute">
        {Array.from({ length: terminalHeight }, (_, index) => (
          <Text key={index}>{" ".repeat(terminalWidth)}</Text>
        ))}
      </Box>
      <Box
        flexDirection="column"
        width="100%"
        height="100%"
        borderStyle="single"
        borderColor={SemanticColors.focusBorder}
        paddingX={1}
        paddingTop={1}
        gap={1}
      >
        <Panel title="" bordered={false}>
          <Text
            color={
              hasQuery
                ? SemanticColors.inputText
                : SemanticColors.inputPlaceholderText
            }
          >
            <Text color={SemanticColors.headline} bold>
              {SEARCH_OVERLAY_COPY.promptPrefix}{" "}
            </Text>
            {hasQuery ? query : SEARCH_OVERLAY_COPY.placeholder}
          </Text>
        </Panel>
        {searchState.error !== null && (
          <Panel
            title={SEARCH_OVERLAY_COPY.errorTitle}
            borderColor={SemanticColors.error}
          >
            <Text color={SemanticColors.error}>{searchState.error.message}</Text>
          </Panel>
        )}
        <SearchResultsView
          groups={groups}
          loading={searchState.loading}
          hasQuery={hasQuery}
          selectedIndex={selectedIndex}
          totalHits={hits.length}
        />
        <Box flexGrow={1}>
          <SearchResultDetail hit={selectedHit} flexGrow={1} />
        </Box>
        <Panel title="" bordered={false}>
          <Box gap={2}>
            <KeyBadge char="type" label={SEARCH_OVERLAY_COPY.hints.text} />
            <KeyBadge char="↑↓" label={SEARCH_OVERLAY_COPY.hints.select} />
            <KeyBadge char="esc" label={SEARCH_OVERLAY_COPY.hints.close} />
          </Box>
        </Panel>
      </Box>
    </Box>
  );
}
