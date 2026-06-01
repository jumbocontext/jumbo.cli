import { ISearchGateway } from "./ISearchGateway.js";
import { ISearchIndexReader } from "./ISearchIndexReader.js";
import { SearchHit } from "./SearchHit.js";
import { SearchHitGroup } from "./SearchHitGroup.js";
import { SearchRequest } from "./SearchRequest.js";
import { SearchResponse } from "./SearchResponse.js";

export class LocalSearchGateway implements ISearchGateway {
  constructor(private readonly reader: ISearchIndexReader) {}

  async search(request: SearchRequest): Promise<SearchResponse> {
    const hits = await this.reader.search(request.criteria);

    if (!request.criteria.groupByCategory) {
      return { hits };
    }

    return { hits, groups: this.groupByCategory(hits) };
  }

  private groupByCategory(hits: readonly SearchHit[]): SearchHitGroup[] {
    const groups = new Map<string, SearchHit[]>();

    for (const hit of hits) {
      const group = groups.get(hit.category) ?? [];
      group.push(hit);
      groups.set(hit.category, group);
    }

    return [...groups.entries()].map(([category, groupedHits]) => ({
      category,
      hits: groupedHits,
    }));
  }
}
