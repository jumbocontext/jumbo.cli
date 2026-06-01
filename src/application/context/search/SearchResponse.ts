import { SearchHit } from "./SearchHit.js";
import { SearchHitGroup } from "./SearchHitGroup.js";

export interface SearchResponse {
  readonly hits: readonly SearchHit[];
  readonly groups?: readonly SearchHitGroup[];
}
