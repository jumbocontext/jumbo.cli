import { SearchDocument } from "./SearchDocument.js";
import { SearchDocumentSource } from "./SearchDocumentSource.js";

export interface ISearchIndexWriter {
  upsert(document: SearchDocument): Promise<void>;
  remove(source: SearchDocumentSource): Promise<void>;
}
