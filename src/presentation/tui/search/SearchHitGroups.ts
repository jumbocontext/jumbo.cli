import type { SearchHit } from "../../../application/context/search/SearchHit.js";
import type { SearchHitGroup } from "../../../application/context/search/SearchHitGroup.js";
import type { SearchResponse } from "../../../application/context/search/SearchResponse.js";

export function resolveSearchHitGroups(
  response: SearchResponse | null,
): readonly SearchHitGroup[] {
  if (response === null) {
    return [];
  }

  if (response.groups !== undefined && response.groups.length > 0) {
    return response.groups;
  }

  const groups = new Map<string, SearchHit[]>();

  for (const hit of response.hits) {
    groups.set(hit.category, [...(groups.get(hit.category) ?? []), hit]);
  }

  return Array.from(groups.entries()).map(([category, hits]) => ({
    category,
    hits,
  }));
}
