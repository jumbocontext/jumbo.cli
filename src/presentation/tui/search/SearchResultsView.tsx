import React from "react";
import { Box, Text } from "ink";
import type { SearchHitGroup } from "../../../application/context/search/SearchHitGroup.js";
import { SemanticColors, TuiGlyphs } from "../../shared/DesignTokens.js";
import { Panel } from "../ui-primitives/Panel.js";

const SEARCH_RESULTS_VIEW_COPY = {
  title: "Results",
  pending: "Type to search the global memory index.",
  loading: "Searching...",
  empty: "No results matched the search text.",
  category: "Category",
  groups: "Groups",
} as const;

interface SearchResultsViewProps {
  readonly groups: readonly SearchHitGroup[];
  readonly loading: boolean;
  readonly hasQuery: boolean;
  readonly selectedIndex: number;
  readonly totalHits: number;
}

export function SearchResultsView({
  groups,
  loading,
  hasQuery,
  selectedIndex,
  totalHits,
}: SearchResultsViewProps): React.ReactElement {
  const selectedGroup = findGroupForIndex(groups, selectedIndex);

  return (
    <Panel title="" bordered={false}>
      {loading && (
        <Text color={SemanticColors.secondary}>
          {SEARCH_RESULTS_VIEW_COPY.loading}
        </Text>
      )}
      {!loading && !hasQuery && (
        <Text color={SemanticColors.secondary}>
          {SEARCH_RESULTS_VIEW_COPY.pending}
        </Text>
      )}
      {!loading && hasQuery && groups.length === 0 && (
        <Text color={SemanticColors.secondary}>
          {SEARCH_RESULTS_VIEW_COPY.empty}
        </Text>
      )}
      {!loading && totalHits > 0 && (
        <Box gap={2}>
          <Text color={SemanticColors.primary}>
            <Text color={SemanticColors.label}>{SEARCH_RESULTS_VIEW_COPY.title}: </Text>
            {selectedIndex + 1} / {totalHits}
          </Text>
          <Text color={SemanticColors.primary}>
            <Text color={SemanticColors.label}>
              {SEARCH_RESULTS_VIEW_COPY.category}:{" "}
            </Text>
            {formatCategory(selectedGroup?.category ?? "")}
          </Text>
          <Text color={SemanticColors.primary}>
            <Text color={SemanticColors.label}>{SEARCH_RESULTS_VIEW_COPY.groups}: </Text>
            {formatGroupSummary(groups)}
          </Text>
        </Box>
      )}
    </Panel>
  );
}

function findGroupForIndex(
  groups: readonly SearchHitGroup[],
  selectedIndex: number,
): SearchHitGroup | undefined {
  let offset = 0;

  for (const group of groups) {
    const nextOffset = offset + group.hits.length;
    if (selectedIndex >= offset && selectedIndex < nextOffset) {
      return group;
    }
    offset = nextOffset;
  }

  return undefined;
}

function formatGroupSummary(groups: readonly SearchHitGroup[]): string {
  return groups
    .map((group) => `${formatCategory(group.category)} ${group.hits.length}`)
    .join(` ${TuiGlyphs.dot} `);
}

function formatCategory(category: string): string {
  return category
    .split(/[-_\s]+/)
    .filter((part) => part.length > 0)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join(" ");
}
