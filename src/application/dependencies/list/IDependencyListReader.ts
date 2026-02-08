/**
 * Port interface for listing dependencies from the projection store.
 * Used by ListDependenciesQueryHandler to retrieve dependency list with filtering.
 */

import { DependencyView } from "../DependencyView.js";

export interface DependencyListFilter {
  consumer?: string;
  provider?: string;
}

export interface IDependencyListReader {
  /**
   * Retrieves all dependencies, optionally filtered by consumer or provider.
   * @param filter - Optional filter by consumer or provider component name
   * @returns Array of dependency views ordered by creation date (newest first)
   */
  findAll(filter?: DependencyListFilter): Promise<DependencyView[]>;
}
