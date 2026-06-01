import { describe, expect, it, jest } from "@jest/globals";
import { ISearchIndexReader } from "../../../../src/application/context/search/ISearchIndexReader.js";
import { LocalSearchGateway } from "../../../../src/application/context/search/LocalSearchGateway.js";
import { SearchCategory } from "../../../../src/application/context/search/SearchCategory.js";
import { SearchHit } from "../../../../src/application/context/search/SearchHit.js";

describe("LocalSearchGateway", () => {
  it("returns lean hits from the search index reader", async () => {
    const hits: SearchHit[] = [
      {
        source: { type: SearchCategory.COMPONENT, id: "comp-1" },
        category: SearchCategory.COMPONENT,
        title: "SearchIndex",
        summary: "Projected search",
        snippet: "Projected search",
        facets: { status: "active" },
        score: 30,
      },
    ];
    const reader: jest.Mocked<ISearchIndexReader> = {
      findBySource: jest.fn(),
      search: jest.fn<ISearchIndexReader["search"]>().mockResolvedValue(hits),
    };

    const gateway = new LocalSearchGateway(reader);
    const response = await gateway.search({ criteria: { query: "search" } });

    expect(reader.search).toHaveBeenCalledWith({ query: "search" });
    expect(response).toEqual({ hits });
  });

  it("groups hits by category when requested", async () => {
    const hits: SearchHit[] = [
      {
        source: { type: SearchCategory.COMPONENT, id: "comp-1" },
        category: SearchCategory.COMPONENT,
        title: "Component",
        summary: null,
        snippet: null,
        facets: {},
        score: 10,
      },
      {
        source: { type: SearchCategory.DECISION, id: "dec-1" },
        category: SearchCategory.DECISION,
        title: "Decision",
        summary: null,
        snippet: null,
        facets: {},
        score: 10,
      },
    ];
    const reader: jest.Mocked<ISearchIndexReader> = {
      findBySource: jest.fn(),
      search: jest.fn<ISearchIndexReader["search"]>().mockResolvedValue(hits),
    };

    const gateway = new LocalSearchGateway(reader);
    const response = await gateway.search({ criteria: { groupByCategory: true } });

    expect(response.groups).toEqual([
      { category: SearchCategory.COMPONENT, hits: [hits[0]] },
      { category: SearchCategory.DECISION, hits: [hits[1]] },
    ]);
  });
});
