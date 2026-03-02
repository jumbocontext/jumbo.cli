/**
 * Port interface for listing dependencies from the projection store.
 * Used by ListDependenciesQueryHandler to retrieve dependency list with filtering.
 */

import { DependencyView } from "../DependencyView.js";

export interface DependencyListFilter {
  name?: string;
  ecosystem?: string;
  packageName?: string;
  versionConstraint?: string;
  consumer?: string;
  provider?: string;
}

export interface IDependencyViewReader {
  /**
   * Retrieves all dependencies, optionally filtered by consumer or provider.
   * @param filter - Optional filter by consumer or provider component name
   * @returns Array of dependency views ordered by creation date (newest first)
   */
  findAll(filter?: DependencyListFilter): Promise<DependencyView[]>;

  /**
   * Retrieves dependencies by their IDs.
   * @param ids - Array of dependency IDs to retrieve
   * @returns Array of dependency views ordered by creation date (newest first)
   */
  findByIds(ids: string[]): Promise<DependencyView[]>;
}
