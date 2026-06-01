import { SearchCriteria } from "./SearchCriteria.js";
import { SearchHit } from "./SearchHit.js";

export interface ISearchProvider {
  search(criteria: SearchCriteria): Promise<readonly SearchHit[]>;
}
