import { SearchCategory } from "./SearchCategory.js";

export interface ISearchIndexRebuildStore {
  clear(): Promise<number>;
  countByCategory(): Promise<Readonly<Partial<Record<SearchCategory, number>>>>;
}
