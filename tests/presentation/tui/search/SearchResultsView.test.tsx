import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { SearchResultsView } from "../../../../src/presentation/tui/search/SearchResultsView.js";
import type { SearchHit } from "../../../../src/application/context/search/SearchHit.js";

const hit: SearchHit = {
  source: { type: "future-memory", id: "future_1" },
  category: "future-memory",
  title: "Future Memory",
  summary: null,
  snippet: null,
  facets: {},
  score: 1,
};

describe("SearchResultsView", () => {
  it("renders pending, loading, empty, and grouped result states", () => {
    const pending = render(
      <SearchResultsView
        groups={[]}
        loading={false}
        hasQuery={false}
        selectedIndex={0}
        totalHits={0}
      />,
    );
    expect(pending.lastFrame()).toContain("Type to search");
    pending.unmount();

    const loading = render(
      <SearchResultsView
        groups={[]}
        loading={true}
        hasQuery
        selectedIndex={0}
        totalHits={0}
      />,
    );
    expect(loading.lastFrame()).toContain("Searching...");
    loading.unmount();

    const empty = render(
      <SearchResultsView
        groups={[]}
        loading={false}
        hasQuery
        selectedIndex={0}
        totalHits={0}
      />,
    );
    expect(empty.lastFrame()).toContain("No results matched");
    empty.unmount();

    const grouped = render(
      <SearchResultsView
        groups={[{ category: "future-memory", hits: [hit] }]}
        loading={false}
        hasQuery
        selectedIndex={0}
        totalHits={1}
      />,
    );
    expect(grouped.lastFrame()).toContain("Results: 1 / 1");
    expect(grouped.lastFrame()).toContain("Category: Future Memory");
    expect(grouped.lastFrame()).toContain("Groups: Future Memory 1");
    expect(grouped.lastFrame()).toContain("Future Memory");
    grouped.unmount();
  });
});
