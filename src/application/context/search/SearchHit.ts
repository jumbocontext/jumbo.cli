import { SearchCategory } from "./SearchCategory.js";
import { SearchDocumentSource } from "./SearchDocumentSource.js";
import { SearchFacetValue } from "./SearchFacetValue.js";

export interface SearchHit {
  readonly source: SearchDocumentSource;
  readonly category: SearchCategory;
  readonly title: string;
  readonly summary: string | null;
  readonly snippet: string | null;
  readonly facets: Readonly<Record<string, SearchFacetValue>>;
  readonly score: number;
}
