import { SearchCategory } from "./SearchCategory.js";
import { SearchHit } from "./SearchHit.js";

export interface SearchHitGroup {
  readonly category: SearchCategory;
  readonly hits: readonly SearchHit[];
}
