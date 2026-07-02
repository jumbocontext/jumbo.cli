import React from "react";
import { describe, expect, it, jest } from "@jest/globals";
import { render } from "ink-testing-library";
import { StateReaderProvider } from "../../../../src/presentation/tui/state-reading/StateReader.js";
import { SearchOverlay } from "../../../../src/presentation/tui/search/SearchOverlay.js";
import type { SearchResponse } from "../../../../src/application/context/search/SearchResponse.js";

const DOWN_ARROW = "\x1B[B";
const ESCAPE = "\x1B";
const tick = () => new Promise((resolve) => setTimeout(resolve, 25));

async function waitForFrame(
  readFrame: () => string | undefined,
  expectedText: string,
): Promise<string> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const frame = readFrame() ?? "";

    if (frame.includes(expectedText)) {
      return frame;
    }

    await tick();
  }

  return readFrame() ?? "";
}

const groupedResponse: SearchResponse = {
  hits: [
    {
      source: { type: "component", id: "component_search" },
      category: "component",
      title: "Search Overlay",
      summary: "Renders generic search hits.",
      snippet: "Search hits keep source identity.",
      facets: { status: "active" },
      score: 20,
    },
    {
      source: { type: "release-note", id: "note_1" },
      category: "release-note",
      title: "Release Note",
      summary: "Future categories render generically.",
      snippet: null,
      facets: { tags: ["search", "tui"] },
      score: 12,
    },
  ],
  groups: [
    {
      category: "component",
      hits: [
        {
          source: { type: "component", id: "component_search" },
          category: "component",
          title: "Search Overlay",
          summary: "Renders generic search hits.",
          snippet: "Search hits keep source identity.",
          facets: { status: "active" },
          score: 20,
        },
      ],
    },
    {
      category: "release-note",
      hits: [
        {
          source: { type: "release-note", id: "note_1" },
          category: "release-note",
          title: "Release Note",
          summary: "Future categories render generically.",
          snippet: null,
          facets: { tags: ["search", "tui"] },
          score: 12,
        },
      ],
    },
  ],
};

function renderSearchOverlay(
  searchController: { handle: (request: unknown) => Promise<SearchResponse> },
  onClose = jest.fn(),
) {
  return render(
    <StateReaderProvider controllers={{ searchController }} options={{ tickMs: 0 }}>
      <SearchOverlay onClose={onClose} />
    </StateReaderProvider>,
  );
}

describe("SearchOverlay", () => {
  it("renders grouped metadata and current generic hit detail", async () => {
    const { stdin, lastFrame, unmount } = renderSearchOverlay({
      handle: jest.fn(async () => groupedResponse),
    });

    stdin.write("search");
    const frame = await waitForFrame(lastFrame, "Results: 1 / 2");

    expect(frame).toContain("Category: Component");
    expect(frame).toContain("Groups: Component 1");
    expect(frame).toContain("Release Note 1");
    expect(frame).toContain("Search Overlay");
    expect(frame).toContain("component:component_search");
    expect(frame).toContain("Search hits keep source identity.");
    expect(frame).not.toContain("▸");

    stdin.write(DOWN_ARROW);
    await waitForFrame(lastFrame, "Results: 2 / 2");

    expect(lastFrame()).toContain("Category: Release Note");
    expect(lastFrame()).toContain("release-note:note_1");
    expect(lastFrame()).toContain("Future categories render generically.");
    unmount();
  });

  it("renders empty and unavailable states", async () => {
    const { stdin, lastFrame, unmount } = renderSearchOverlay({
      handle: jest.fn(async () => ({ hits: [], groups: [] })),
    });

    expect(lastFrame()).toContain("Type to search the global memory");

    stdin.write("none");
    const frame = await waitForFrame(lastFrame, "No results matched");

    expect(frame).toContain("No results matched the search text.");
    unmount();
  });

  it("renders loading while a search request is pending", async () => {
    const pending = new Promise<SearchResponse>(() => {});
    const { stdin, lastFrame, unmount } = renderSearchOverlay({
      handle: jest.fn(async () => pending),
    });

    stdin.write("slow");
    const frame = await waitForFrame(lastFrame, "Searching...");

    expect(frame).toContain("Searching...");
    unmount();
  });

  it("renders controller errors", async () => {
    const { stdin, lastFrame, unmount } = renderSearchOverlay({
      handle: jest.fn(async () => {
        throw new Error("Search index unavailable");
      }),
    });

    stdin.write("broken");
    const frame = await waitForFrame(lastFrame, "Search index unavailable");

    expect(frame).toContain("Search Error");
    expect(frame).toContain("Search index unavailable");
    unmount();
  });

  it("closes on escape", async () => {
    const onClose = jest.fn();
    const { stdin, unmount } = renderSearchOverlay({
      handle: jest.fn(async () => ({ hits: [], groups: [] })),
    }, onClose);

    stdin.write(ESCAPE);
    await tick();

    expect(onClose).toHaveBeenCalledTimes(1);
    unmount();
  });
});
