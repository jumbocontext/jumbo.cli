import { ISearchIndexReader } from "../../../application/context/search/ISearchIndexReader.js";
import { ISearchProvider } from "../../../application/context/search/ISearchProvider.js";
import { SearchCriteria } from "../../../application/context/search/SearchCriteria.js";
import { SearchHit } from "../../../application/context/search/SearchHit.js";

export class ProjectedSearchIndexProvider implements ISearchProvider {
  constructor(private readonly reader: ISearchIndexReader) {}

  async search(criteria: SearchCriteria): Promise<readonly SearchHit[]> {
    return this.reader.search(criteria);
  }
}
