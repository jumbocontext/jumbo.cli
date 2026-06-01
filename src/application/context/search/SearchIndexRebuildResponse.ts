import { SearchCategory } from "./SearchCategory.js";

export interface SearchIndexRebuildResponse {
  readonly success: boolean;
  readonly eventsInspected: number;
  readonly documentsIndexed: number;
  readonly removedEntries: number;
  readonly countsByCategory: Readonly<Partial<Record<SearchCategory, number>>>;
}
