import { SearchCategory } from "./SearchCategory.js";
import { SearchDocumentSource } from "./SearchDocumentSource.js";
import { SearchFacetValue } from "./SearchFacetValue.js";

export interface SearchDocument {
  readonly source: SearchDocumentSource;
  readonly category: SearchCategory;
  readonly title: string;
  readonly summary: string | null;
  readonly content: string;
  readonly facets: Readonly<Record<string, SearchFacetValue>>;
  readonly metadata: Readonly<Record<string, SearchFacetValue>>;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}
