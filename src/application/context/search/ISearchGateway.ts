import { SearchRequest } from "./SearchRequest.js";
import { SearchResponse } from "./SearchResponse.js";

export interface ISearchGateway {
  search(request: SearchRequest): Promise<SearchResponse>;
}
