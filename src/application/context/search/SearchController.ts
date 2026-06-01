import { ISearchGateway } from "./ISearchGateway.js";
import { SearchRequest } from "./SearchRequest.js";
import { SearchResponse } from "./SearchResponse.js";

export class SearchController {
  constructor(private readonly gateway: ISearchGateway) {}

  async handle(request: SearchRequest): Promise<SearchResponse> {
    return this.gateway.search(request);
  }
}
