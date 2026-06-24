import React from "react";
import { Box, Text } from "ink";
import type { SearchHit } from "../../../application/context/search/SearchHit.js";
import type { SearchFacetValue } from "../../../application/context/search/SearchFacetValue.js";
import { SemanticColors } from "../../shared/DesignTokens.js";
import { Panel } from "../ui-primitives/Panel.js";

const SEARCH_RESULT_DETAIL_COPY = {
  title: "Result Detail",
  empty: "Type a search to inspect the current result.",
  source: "Source",
  category: "Category",
  score: "Score",
  summary: "Summary",
  snippet: "Snippet",
  facets: "Facets",
} as const;

interface SearchResultDetailProps {
  readonly hit?: SearchHit;
  readonly width?: number;
  readonly flexGrow?: number;
}

export function SearchResultDetail({
  hit,
  width,
  flexGrow,
}: SearchResultDetailProps): React.ReactElement {
  return (
    <Panel
      title={SEARCH_RESULT_DETAIL_COPY.title}
      width={width}
      flexGrow={flexGrow}
    >
      {hit === undefined ? (
        <Text color={SemanticColors.secondary}>
          {SEARCH_RESULT_DETAIL_COPY.empty}
        </Text>
      ) : (
        <Box flexDirection="column">
          <Text color={SemanticColors.headline} bold>
            {hit.title}
          </Text>
          <Box marginTop={1} flexDirection="column">
            {hit.summary !== null && (
              <DetailSection
                label={SEARCH_RESULT_DETAIL_COPY.summary}
                value={hit.summary}
              />
            )}
            {hit.snippet !== null && (
              <DetailSection
                label={SEARCH_RESULT_DETAIL_COPY.snippet}
                value={hit.snippet}
              />
            )}
          </Box>
          <Box marginTop={1} flexDirection="column">
          <DetailLine
            label={SEARCH_RESULT_DETAIL_COPY.source}
            value={`${hit.source.type}:${hit.source.id}`}
          />
          <DetailLine label={SEARCH_RESULT_DETAIL_COPY.category} value={hit.category} />
          <DetailLine
            label={SEARCH_RESULT_DETAIL_COPY.score}
            value={String(hit.score)}
          />
          </Box>
          {Object.entries(hit.facets).length > 0 && (
            <Box flexDirection="column" marginTop={1}>
              <Text color={SemanticColors.label}>
                {SEARCH_RESULT_DETAIL_COPY.facets}
              </Text>
              {Object.entries(hit.facets).map(([key, value]) => (
                <DetailLine key={key} label={key} value={formatFacetValue(value)} />
              ))}
            </Box>
          )}
        </Box>
      )}
    </Panel>
  );
}

function DetailSection({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}): React.ReactElement {
  return (
    <Box flexDirection="column">
      <Text color={SemanticColors.label}>{label}</Text>
      <Text color={SemanticColors.primary}>{value}</Text>
    </Box>
  );
}

function DetailLine({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}): React.ReactElement {
  return (
    <Text color={SemanticColors.primary}>{label}: {value}</Text>
  );
}

function formatFacetValue(value: SearchFacetValue): string {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (value === null) {
    return "";
  }

  return String(value);
}
