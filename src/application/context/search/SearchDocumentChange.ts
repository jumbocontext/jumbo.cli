import { SearchDocument } from "./SearchDocument.js";
import { SearchDocumentSource } from "./SearchDocumentSource.js";

export type SearchDocumentChange =
  | { readonly operation: "upsert"; readonly document: SearchDocument }
  | { readonly operation: "remove"; readonly source: SearchDocumentSource };
