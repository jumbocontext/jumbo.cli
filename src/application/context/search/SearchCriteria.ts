import { SearchCategory } from "./SearchCategory.js";

export interface SearchCriteria {
  readonly query?: string;
  readonly category?: SearchCategory;
  readonly limit?: number;
  readonly groupByCategory?: boolean;
}
