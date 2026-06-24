import type { SearchHit } from "../../../application/context/search/SearchHit.js";
import type { SearchHitGroup } from "../../../application/context/search/SearchHitGroup.js";

export function flattenSearchHits(
  groups: readonly SearchHitGroup[],
): readonly SearchHit[] {
  return groups.flatMap((group) => group.hits);
}
