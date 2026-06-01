import { SearchCriteria } from "./SearchCriteria.js";
import { SearchDocument } from "./SearchDocument.js";
import { SearchDocumentSource } from "./SearchDocumentSource.js";
import { SearchHit } from "./SearchHit.js";

export interface ISearchIndexReader {
  findBySource(source: SearchDocumentSource): Promise<SearchDocument | null>;
  search(criteria: SearchCriteria): Promise<SearchHit[]>;
}
